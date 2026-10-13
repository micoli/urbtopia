# Groups: schema and RPC

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md
ADR: ../../../docs/adr/0030-groups-have-no-invitation-link.md

## What to build

Supabase migration with tables for Groups, members, Group messages and a read cursor per member, and `urb_`-prefixed RPC: create (name + Friend ids), rename, add members, remove member, leave, delete, post message, list Groups (with unread and last message), read messages, mark read, block-aware message filtering. RLS on every table, no direct client writes.

## Acceptance criteria

- [ ] Limits enforced server-side: name 3-30 with forbidden-words filter, 10 members, 5 created and 10 joined per player; only Friends of the creator can be added.
- [ ] Creator cannot leave without deleting; delete removes messages.
- [ ] A member who stops being a Friend of the creator (removal or Block, either direction) is removed, by trigger or inside the friendship RPC.
- [ ] Group messages: 500 characters, purged after 30 days, daily cap shared with Messages (`urb_message_daily_cap`).
- [ ] Reading messages hides those of authors the reader has blocked; the blocked author learns nothing.
- [ ] Deleting cloud data (`urb_delete_my_saves`) cleans Groups and memberships.
- [ ] SQL tests in the CI validation harness for each rule above; generated types updated.
