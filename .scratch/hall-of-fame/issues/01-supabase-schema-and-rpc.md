# Showcase table and Hall of fame RPC

Status: done - implemented
Spec: ../spec.md

## What to build

Migration adding the `urb_showcase` table and its RPC functions, all `urb_`-prefixed, writes only through RPC (ADR 0015, ADR 0029). No client code yet.

## Acceptance criteria

- [ ] `urb_showcase`: one row per user (envelope jsonb, format version, ranking Citizens, published Citizens, updated_at), readable by every authenticated user including anonymous ones, never writable directly; deleted with the account.
- [ ] `urb_publish_showcase(envelope, format_version, citizens)`: 1 MB cap, replaces the Showcase, and moves the ranking Citizens only if growth stays under 20 % and at least 500 per hour of server time (otherwise the Showcase is replaced and the ranking keeps its previous value). Refuses an account without a Handle.
- [ ] `urb_hall_of_fame()`: ten rows, one per account, ordered by ranking Citizens descending then seniority, with Handle and Avatar; excludes opted-out accounts and accounts Blocked in either direction with the caller; no envelope returned.
- [ ] `urb_get_showcase(user)`: returns the envelope of a non-opted-out, non-Blocked account.
- [ ] `urb_set_hall_of_fame_optout(bool)` and a stored "notice seen" flag; opting out deletes the Showcase at once; publishing is refused until the notice is marked seen.
- [ ] Block and `urb_delete_my_saves` clean up as needed.
- [ ] pgTAP tests in `supabase/tests` for each rule above; types regenerated (`database.types.ts`).
