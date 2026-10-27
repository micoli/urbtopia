# Core Day cycle

Status: ready-for-agent
Spec: ../spec.md

## What to build

Pure function giving the Cycle hour, the phase (day, night, dawn, dusk) and a light level from a game-clock time. Constants in the core, no clock read. A new City gets an initial `timeOffset` that starts it at dawn.

## Acceptance criteria

- [ ] Cycle hour, Daytime and Night boundaries tested (06:00, 22:00, wrap, negative times).
- [ ] Dawn and dusk fades are within the Night and continuous at the boundaries.
- [ ] A new City starts at 06:00 whatever the real time; loaded saves keep their `timeOffset`.
- [ ] Exported from `src/core/index.ts`; no DOM or three import.
