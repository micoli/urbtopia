# Always day setting and URL flags

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 03

## What to build

Per-device setting "Always day" (off by default, outside the save) plus URL flags: `?e2e` implies it, `?always-day` alone, `?time=HH:MM` pins the cycle hour.

## Acceptance criteria

- [ ] Setting in the settings UI, persisted in local storage (try/catch), FR/EN strings.
- [ ] Always day lights the map as Daytime without changing power or the cycle.
- [ ] `?e2e`, `?always-day`, `?time=` documented in CLAUDE.md; visual baselines stay stable.
