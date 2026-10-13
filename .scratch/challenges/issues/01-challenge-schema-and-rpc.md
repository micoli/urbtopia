# Challenge schema and RPC

Status: needs-triage
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [ ] Tables `urb_challenges` (kind, variants with Citizens threshold, goal lines as jsonb, reward, name keys, optional hand-written name FR/EN, starts_at, ends_at), `urb_challenge_acceptances` (one per account and Challenge, server accepted_at) and `urb_medals`; RLS, no client access, `urb_` prefix.
- [ ] `pg_cron` job creating the 3 Daily variants each day; Events inserted by hand (documented SQL snippet).
- [ ] RPC: list active Challenges (cursor, like the social state), accept (online, account with email and Handle, refused if another Challenge is accepted and unfinished), declare completion (idempotent on acceptance id; checks deadline against the server clock, single claim), list own Medals.
- [ ] Expiry: an accepted Challenge past its deadline is closed without reward.
- [ ] pgTAP tests (single claim, idempotent declare, one active acceptance, deadline, isolation) and `supabase db lint` pass.
