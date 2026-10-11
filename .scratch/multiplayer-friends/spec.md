# Multiplayer, delivery 1: Handle, search and Friends

Status: ready-for-agent

## Problem

Urbtopia is solo. The goal is multiplayer between Friends, in three deliveries: (1) Handle, email search and Friends, (2) text messaging, (3) Trade offers. This spec covers delivery 1 only; the schema and vocabulary anticipate 2 and 3 but nothing of them is built.

## Decisions

Recorded in [ADR 0025](../../docs/adr/0025-trade-escrow-trusts-the-client.md) and [ADR 0026](../../docs/adr/0026-social-features-poll-instead-of-realtime.md), building on [ADR 0015](../../docs/adr/0015-supabase-cloud-save-mirror-with-rpc-only-writes.md). Vocabulary (Handle, Friend request, Friend, Block, Player account) in `CONTEXT.md`.

- Multiplayer requires a Player account with an attached email and a Handle. Anonymous accounts see no multiplayer. Solo play is unchanged.
- Entry point: a "Friends" tab on the city management page. Without an email it first offers the existing magic-link flow, then asks for a Handle.
- Handle: 3 to 20 characters among letters, digits, `_` and `-`; unique case-insensitively; changeable once every 30 days; server-side forbidden-words filter; no human moderation.
- Search by exact email only, never partial. The response is identical whether the account exists, is blocked, or is not findable: "request sent if this account exists". The email is never returned to a client.
- A player can make themselves not findable by email (setting, default findable).
- Search rate limit: 10 per hour and 30 per day per user, counted in a `urb_` table checked inside the RPC; over the limit returns an explicit error with the remaining delay. Friend requests have their own cap. No CAPTCHA.
- Friend request: must be accepted. States `pending`, `accepted`, `blocked`. Caps: 50 Friends, 20 outgoing pending requests.
- Block: hides the blocker from the blocked account's searches and silently refuses its requests.
- Removing a Friend deletes the link on both sides, no notification.
- Deleting cloud data (`urb_delete_my_saves`) also deletes Handle, friendships and requests. Accounts with an email are never purged.
- All writes go through `urb_`-prefixed RPC, RLS on every table, no direct client writes (ADR 0015).
- Client: `SocialClient` interface in `src/social/` (not in `src/core`), `supabase-js` loaded through dynamic `import()`, a fake client for tests.
- Polling (ADR 0026): every 15 s while the Friends panel is open, every 60 s for the pending-requests badge while closed, stopped while the tab is hidden; the RPC returns only what changed since a cursor.
- UI strings translated FR/EN, one React component per file.

## Out of scope

Messaging, Trade offers, Escrow, Realtime/WebSocket, CAPTCHA, human moderation, friend suggestions, profile pages or avatars, seeing a Friend's city.

## Issues

1. `01-social-schema-and-rpc` - tables, RPC, RLS, rate limit, pgTAP
2. `02-social-client` - `SocialClient`, lazy `supabase-js`, fake client, types generation
3. `03-handle-onboarding-ui` - Friends tab, email prerequisite, Handle choice, findable setting
4. `04-search-and-requests-ui` - search, send/accept/refuse requests, Friends list, remove, Block
5. `05-polling-and-badge` - polling cadence, cursor, badge, visibility pause
