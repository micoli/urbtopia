# Four Social tabs and cumulated badge

Status: done - tsc, eslint and vitest pass; Groups badge is 0 until issue 05
Blocked by: 02
Spec: ../spec.md

## What to build

Social window with Friends, Groups, Exchanges, Profile tabs, each with its badge. Friends tab lightened (list, requests, "Add a friend" opening the search form). The Groups tab renders an empty placeholder until issue 05. The HUD Social button badge sums Friends, Groups and Exchanges.

## Acceptance criteria

- [x] Tabs accessible (`tablist`, keyboard, short labels with icons on phone width).
- [x] Friends tab no longer shows Handle, Avatar, findable or blocked list (done in 02, with the Profile tab).
- [x] `pendingCount` helpers cover the cumulated badge; unit tests.
- [x] Storybook stories and component tests updated.
