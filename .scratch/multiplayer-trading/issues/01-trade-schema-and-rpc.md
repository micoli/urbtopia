# Trade schema and RPC

Status: done - verified on a local Supabase: 53 pgTAP tests and db lint pass
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Table `urb_trade_offers` (client-generated id, sender, recipient, Lot as jsonb, price, state, timestamps, claim flags), RLS, no client access, `urb_` prefix.
- [x] RPC: create (idempotent on id; Friends only; Lot and price validated; 5 open and 30 per day), accept, refuse, cancel, claim (lot or payment, once), list in the social state with the cursor.
- [x] Lifecycle: open, accepted, refused/cancelled/expired (Lot returns to the sender), lapsed (Lot to the sender, payment to the recipient); Friend removal and Block close the offers; deleting cloud data closes them.
- [x] `pg_cron` job for the 72 h expiries.
- [x] pgTAP tests (single claim, idempotent create, limits, isolation, expiry, block) and `supabase db lint` pass.
