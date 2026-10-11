# Social schema and RPC

Status: done - verified on a local Supabase: 41 pgTAP tests and `db lint` pass
Blocked by: none
Spec: ../spec.md

## What to build

Migration(s) in `supabase/migrations/` defining the social tables and the RPC that are their only write path, per ADR 0015 and the spec decisions. Runs on a local Supabase.

## Acceptance criteria

- [x] Tables prefixed `urb_`: profiles (user id, Handle, findable flag, handle changed at), friendships/requests (pair, state `pending`/`accepted`/`blocked`, requester, timestamps), search attempts (user id, timestamp). RLS enabled everywhere; clients read only their own rows and the Handle of their Friends and pending counterparts; no direct writes.
- [x] RPC: set Handle (format, case-insensitive uniqueness, 30-day change delay, forbidden-words filter), set findable, search by exact email, accept, refuse/cancel, remove Friend, block/unblock, list (friends, incoming and outgoing requests, with a change cursor).
- [x] Search requires the caller to have an email and a Handle; returns the same response whether the target exists, is blocked or is not findable; never returns an email; rate limited to 10/hour and 30/day with an error carrying the remaining delay.
- [x] Caps enforced: 50 Friends, 20 outgoing pending requests; duplicates and self-requests refused; a blocked sender's request is silently dropped.
- [x] `urb_delete_my_saves` also deletes the caller's Handle, friendships and requests.
- [x] Every Postgres object is prefixed `urb_` (existing prefix check passes).
- [x] pgTAP tests: anonymous user refused; Handle rules; user A cannot read B's rows; enumeration-safe search response; rate limit; caps; block behaviour; delete cascades.
- [x] `supabase db lint` passes.
