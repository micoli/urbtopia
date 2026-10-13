# Groups: schema and RPC

Status: done - pgTAP tests (46) pass on the local database; CI run pending
Blocked by: none
Spec: ../spec.md
ADR: ../../../docs/adr/0030-groups-have-no-invitation-link.md

## What to build

Supabase migration with tables for Groups, members, Group messages and a read cursor per member, and `urb_`-prefixed RPC: create (name + Friend ids), rename, add members, remove member, leave, delete, post message, list Groups (with unread and last message), read messages, mark read, block-aware message filtering. RLS on every table, no direct client writes.

## Acceptance criteria

- [x] Limits enforced server-side: name 3-30 with forbidden-words filter, 10 members, 5 created and 10 joined per player; only Friends of the creator can be added.
- [x] Creator cannot leave without deleting; delete removes messages.
- [x] A member who stops being a Friend of the creator (removal or Block, either direction) is removed, by trigger or inside the friendship RPC.
- [x] Group messages: 500 characters, purged after 30 days, daily cap shared with Messages (`urb_message_daily_cap`).
- [x] Reading messages hides those of authors the reader has blocked; the blocked author learns nothing.
- [x] Deleting cloud data (`urb_delete_my_saves`) cleans Groups and memberships.
- [x] SQL tests in the CI validation harness for each rule above; generated types updated.
