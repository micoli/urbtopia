# Integration with Always day, time and street view

Status: resolved
Spec: ../spec.md
Blocked by: 02, 03

## What to build

Always day switches all windows off, `?time=` drives them, street view shows them, the Night clock follows the Day cycle at 1 Hz.

## Acceptance criteria

- [x] `?e2e` shows no lit window; `?time=23:00` without Always day does.
- [x] Street view shows the lit windows.
- [x] Playwright (headed) scenario with a Night screenshot.

## Findings

- Always day, `?time=` and the Night clock were wired in `GameScene.refreshLighting` with ticket 02. Added here: the Playwright scenario (`scripts/dayCycle.e2e.ts`, headed) checking the glow level, the Night clock and the dark buildings, with a Night screenshot attached to the report.
- Street view checked by hand: lit windows show on the facade at 23:30.
- A new City is in an Adaptation period for 24 hours, so its windows stay lit even without power.
- In dev, a console `import('/src/store/gameStore.ts')` can return another instance of the store than the app's: use `window.__gameStore`.
