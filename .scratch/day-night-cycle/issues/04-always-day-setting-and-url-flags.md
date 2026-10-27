# Always day setting and URL flags

Status: resolved
Spec: ../spec.md
Blocked by: 03

## What to build

Per-device setting "Always day" (off by default, outside the save) plus URL flags: `?e2e` implies it, `?always-day` alone, `?time=HH:MM` pins the cycle hour.

## Acceptance criteria

- [x] Setting in the settings UI, persisted in local storage (try/catch), FR/EN strings.
- [x] Always day lights the map as Daytime without changing power or the cycle.
- [x] `?e2e`, `?always-day`, `?time=` documented in CLAUDE.md; visual baselines stay stable.
