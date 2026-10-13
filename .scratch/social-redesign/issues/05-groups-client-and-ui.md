# Groups: client and UI

Status: done - tsc, eslint, vitest (2731) and build pass; UI not driven in a browser
Blocked by: 03, 04
Spec: ../spec.md

## What to build

`SocialClient` extended with the Group RPC (and fake client), polling per ADR 0026, and the Groups tab: list, "New group" form, empty state, Group view with menu and member list including Block.

## Acceptance criteria

- [x] List sorted by last message with name, member count, preview and unread dot; empty state explains Groups and points to the Friends tab when the player has no Friend.
- [x] "New group" form: name and at least one ticked Friend.
- [x] Group view reuses `MessageList` and `MessageComposer`; menu Members and Leave for all; Rename, Add friends, Remove a member, Delete (inline confirm) for the creator.
- [x] Member list has a Block action; blocked authors' messages disappear.
- [x] Polling 15 s while the tab is open, 60 s for the badge, paused while the tab is hidden; unread cleared on open.
- [x] Error messages for each server limit, FR/EN strings, one component per file, component tests with the fake client, stories.
