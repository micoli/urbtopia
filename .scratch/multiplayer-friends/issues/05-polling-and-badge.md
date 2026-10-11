# Polling and badge

Status: ready-for-agent
Blocked by: 04
Spec: ../spec.md

## What to build

Polling per ADR 0026: refresh the Friends panel every 15 s while open, refresh a pending-requests badge every 60 s while closed, pause while the tab is hidden.

## Acceptance criteria

- [ ] Polls use the change cursor and return only changes.
- [ ] Interval 15 s (panel open) / 60 s (closed), stopped on `visibilitychange` hidden, resumed with an immediate poll when visible.
- [ ] No polling for accounts without email and Handle, or when cloud is unavailable.
- [ ] Badge on the Friends tab shows the incoming pending requests count.
- [ ] Tests with fake timers.
