# Hall of fame and city Visit

Status: done - implemented

## Problem

Cities are private: a player can only see their own. There is no way to see how big other cities get, or to look at one.

## Decisions

Recorded in [ADR 0029](../../docs/adr/0029-hall-of-fame-trusts-the-client-with-growth-caps.md). Vocabulary (Hall of fame, Showcase, Visit) in `CONTEXT.md`.

- Ranking: the ten biggest cities by Citizens, one entry per Player account, never the caller's own city (the ranks count only the others), ties broken by seniority. Each entry shows rank, Avatar, Handle, Citizens and a "Visit" button. No Medals, no add-Friend button for now.
- Participation: every Player account with a Handle is in by default (opt-out, toggle in the Social window). A one-time notice on the first launch after release carries the toggle; nothing is published before it has been seen. Opting out deletes the Showcase at once. A Block hides the Showcase between the two accounts.
- Showcase: the full city state minus the trade ledger, in a table separate from the Cloud save, replaced at each push (same 5 minute debounce) with the Citizens count stored beside it. Readable by every authenticated user, anonymous ones included; written only through `urb_` RPC functions. Subject to the same 1 MB cap.
- Trust: the client declares Citizens. The RPC refuses a ranking value growing faster than 20 % and at least 500 Citizens per hour of server time; the Showcase is still replaced, the ranking keeps its previous value.
- Access: anyone, anonymous included, can consult the Hall of fame and Visit. Appearing in it requires a Handle (hence an email).
- Entry point: a section of the Social window, read-only for anonymous accounts.
- Visit: the Showcase is loaded into a throwaway in-memory state, read-only through the Command gateway, nothing advances. Autosave, Cloud sync and tab ownership are off; leaving returns to the player's own city untouched.
- Format: a Showcase of a newer format than the app is refused with an "update the game" message; an older one is migrated in memory only and never written back.
- `supabase-js` stays behind the dynamic `import()` and a client interface, like `SocialClient`; `src/core` knows nothing of it.

## Out of scope

Medals or rewards tied to a rank, anti-cheat beyond the growth cap, several rankings (by building count, Urbs), Friend request from the ranking, live Visit of a city being played.

## Issues

1. [Showcase table and Hall of fame RPC](issues/01-supabase-schema-and-rpc.md)
2. [Showcase client and publication](issues/02-showcase-client.md) (after 01)
3. [Opt-out notice and toggle](issues/03-first-launch-notice-and-optout.md) (after 02)
4. [Hall of fame section in the Social window](issues/04-hall-of-fame-list.md) (after 02)
5. [Visit a Showcase read-only](issues/05-visit-mode.md) (after 02, 04)
6. [Guide article and docs](issues/06-guide-and-docs.md) (after 05)
