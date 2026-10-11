# Messages schema and RPC

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [ ] Table `urb_messages` with RLS, no client access; every object prefixed `urb_`.
- [ ] `urb_send_message(to, body)`: Friends only, 1-500 characters trimmed, 30 per minute with remaining delay in the error.
- [ ] `urb_list_messages(with, after_id)`: the caller's Conversation with a Friend, oldest first, marks the other side's Messages read.
- [ ] `urb_list_social` friends carry `unread` and `lastMessageAt`; sending and reading bump the social revision.
- [ ] Removing a Friend and Block delete the Conversation; `pg_cron` purges Messages older than 30 days.
- [ ] pgTAP tests and `supabase db lint` pass.
