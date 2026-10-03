# Open MaximalStats from every HUD layout

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 1
Blocked by: 01
Spec: [Ecological city](../spec.md)

## What to build

Replace passive statistics with an accessible entry point to an explained city-management panel.

## Acceptance criteria

- [x] MinimalStats and CityStats open MaximalStats in layouts A, B and C by pointer, touch and keyboard.
- [x] Display Citizens, economic building counts, current energy Demand/Capacity and water statistics from derived state.
- [x] Explain nominal production capacity, effective production and utilization per Material/Good without adding incompatible units into a misleading total.
- [x] Show only implemented ecological sections; distinguish later-stage features without presenting fabricated measurements.
- [x] Provide clear closing/focus behavior and usable mobile scrolling; translate new strings in FR/EN and keep one React component per file.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/ui/MaximalStats.tsx; MinimalStats.tsx; CityStats.tsx; MaximalStats.test.tsx. See [delivery validation](../validation.md) for checks and practical limits.
