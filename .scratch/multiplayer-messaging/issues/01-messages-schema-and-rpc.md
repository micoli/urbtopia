# Messages schema and RPC

Status: done - verified: pgTAP, db lint, tsc, vitest
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Table `urb_messages` with RLS, no client access; every object prefixed `urb_`.
- [x] `urb_send_message(to, body)`: Friends only, 1-500 characters trimmed, 30 per minute with remaining delay in the error.
- [x] `urb_list_messages(with, after_id)`: the caller's Conversation with a Friend, oldest first, marks the other side's Messages read.
- [x] `urb_list_social` friends carry `unread` and `lastMessageAt`; sending and reading bump the social revision.
- [x] Removing a Friend and Block delete the Conversation; `pg_cron` purges Messages older than 30 days.
- [x] pgTAP tests and `supabase db lint` pass.
