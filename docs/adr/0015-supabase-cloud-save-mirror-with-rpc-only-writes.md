# Cloud save is a Supabase mirror of the local save, written only through RPC

Accepted. Extends [ADR 0003](0003-localstorage-versioned-save-envelope.md), which stays valid: the local save remains the source of truth.

A Player account is an anonymous Supabase Auth user, created silently on first play and upgradable to an email magic link: `updateUser({ email })` keeps the user id and the saves, and signing in with an already used email switches to that account (the sync layer then forgets its revision and lets the Save conflict dialog arbitrate). Email confirmation must be enabled. The Cloud save (current + 3 previous versions) lives in a `urb_saves` table that the client can read but never write directly. All writes go through Postgres functions (`urb_push_save`, `urb_list_saves`, `urb_restore_save`, `urb_delete_my_saves`), which enforce the rules: envelope size cap, at most 4 rows per user, history rotating at most once an hour, and compare-and-swap on a server-owned `revision`.

The client keeps `baseRevision` in the local meta record (not in the envelope, so no format bump). A push whose `baseRevision` is behind the server, with a locally modified city, is a Save conflict: the player chooses, and the loser becomes a previous version. Pushes are debounced to once per 5 minutes while dirty, plus on `pagehide` (keepalive fetch) and a manual button. The envelope is stored as-is (jsonb) and validated only by the client at load, so a Cloud save newer than the app is refused like a local one.

Every Postgres object the project creates (tables, functions, triggers, policies, indexes, types, `pg_cron` jobs) is prefixed `urb_`, so Urbix coexists with other projects in a shared Supabase database without name collisions.

Cloud code lives in `src/persistence/cloud/` behind a `CloudSaveClient` interface; `supabase-js` is loaded with a dynamic `import()` so offline players never pay for it. `src/core` knows nothing about it.

## Why

- `pagehide` cannot await async writes and Supabase can be down or unreachable: localStorage must stay authoritative, the cloud is a mirror.
- Client clocks (`savedAt`) cannot arbitrate between devices; a server revision with compare-and-swap is atomic and clock-free.
- Row-level security alone cannot express "4 rows max" or compare-and-swap, and a modified client could write anything; RPC-only writes keep the rules in versioned migrations testable with pgTAP.
- Anonymous auth gives zero friction and no password to store; a Player account carries no personal data until an email is attached.

## Consequences

- Losing a city is the worst failure: no silent overwrite, and previous versions exist on both sides.
- Anonymous accounts inactive for 90 days are purged by `pg_cron`; accounts with an email are kept.
- The publishable key is public by design: the data is protected by RLS and the RPC rules, never by that key.
- Abuse of anonymous sign-ups is bounded by the size and row caps and Supabase rate limits; a CAPTCHA is deferred until abuse is observed.
- Any change to the `urb_saves` schema is a migration validated in CI against a local Supabase.
