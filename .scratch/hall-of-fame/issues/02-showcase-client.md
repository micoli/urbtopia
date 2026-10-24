# Showcase client and publication

Status: done - implemented
Blocked by: 01
Spec: ../spec.md

## What to build

A `ShowcaseClient` interface in `src/persistence/cloud/` (real + in-memory fake, like `SocialClient`), and publication of the Showcase at each Cloud save push.

## Acceptance criteria

- [ ] Interface: `publish`, `hallOfFame`, `getShowcase`, `setOptOut`, `markNoticeSeen`; typed errors (offline, too large, no Handle, notice not seen).
- [ ] The published envelope is the city state minus the trade ledger; Citizens computed from the state on the client.
- [ ] Publication rides on the existing push (5 min debounce, `pagehide`, manual), only for an account with a Handle, not opted out, notice seen; a failure never blocks the Cloud save.
- [ ] `supabase-js` stays in the lazy chunk; `src/core` imports nothing cloud-related.
- [ ] Without configuration or network the game behaves as today.
