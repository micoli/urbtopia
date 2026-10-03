# Explain and validate the renewable energy stage

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 14, 06
Spec: [Ecological city](../spec.md)

## What to build

Complete a playable energy stage with forecasts, learning objectives and balancing evidence.

## Acceptance criteria

- [x] Extend MaximalStats with Demand, generation by source, actual allocation, transfers, storage, backup costs/emissions and unmet needs.
- [x] Teach solar self-consumption, sharing, wind variability and battery limits using short objectives and understandable forecasts.
- [x] Provide contextual advice favoring Demand reduction and useful source/storage combinations.
- [x] Validate reference cities for conservation, shortage fairness, backup tradeoffs, adaptation and affordability; record balancing changes.
- [x] Check all layouts and FR/EN and run relevant determinism/save/asset tests, build and lint before release.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/ui/MaximalStats.tsx; validation.md; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
