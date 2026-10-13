# Four Social tabs and cumulated badge

Status: ready-for-agent
Blocked by: 02
Spec: ../spec.md

## What to build

Social window with Friends, Groups, Exchanges, Profile tabs, each with its badge. Friends tab lightened (list, requests, "Add a friend" opening the search form). The Groups tab renders an empty placeholder until issue 05. The HUD Social button badge sums Friends, Groups and Exchanges.

## Acceptance criteria

- [ ] Tabs accessible (`tablist`, keyboard, short labels with icons on phone width).
- [ ] Friends tab no longer shows Handle, Avatar, findable or blocked list.
- [ ] `pendingCount` helpers cover the cumulated badge; unit tests.
- [ ] Storybook stories and component tests updated.
