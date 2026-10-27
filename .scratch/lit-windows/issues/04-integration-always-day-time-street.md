# Integration with Always day, time and street view

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 02, 03

## What to build

Always day switches all windows off, `?time=` drives them, street view shows them, the Night clock follows the Day cycle at 1 Hz.

## Acceptance criteria

- [ ] `?e2e` shows no lit window; `?time=23:00` without Always day does.
- [ ] Street view shows the lit windows.
- [ ] Playwright (headed) scenario with a Night screenshot.
