# Challenge schema and RPC

Status: done - verified on a local Supabase: 242 pgTAP tests and db lint pass
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Tables `urb_challenges` (kind, variants with Citizens threshold, goal lines as jsonb, reward, name keys, optional hand-written name FR/EN, starts_at, ends_at), `urb_challenge_acceptances` (one per account and Challenge, server accepted_at) and `urb_medals`; RLS, no client access, `urb_` prefix.
- [x] `pg_cron` job creating each day one Daily variant per difficulty and per band (Citizens threshold 0, 100, 200, 600), drawn from a template table; `urb_create_event` publishes an Event; Events inserted by hand (documented SQL snippet).
- [x] RPC: list active Challenges (cursor, like the social state), accept (online, account with email and Handle, refused if another Challenge is accepted and unfinished), declare completion (idempotent on acceptance id; checks deadline against the server clock, single claim), list own Medals.
- [x] Expiry: an accepted Challenge past its deadline is closed without reward.
- [x] pgTAP tests (single claim, idempotent declare, one active acceptance, deadline, isolation) and `supabase db lint` pass.
