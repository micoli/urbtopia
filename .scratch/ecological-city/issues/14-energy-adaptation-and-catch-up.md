# Adapt existing cities and preserve deterministic energy catch-up

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 13
Spec: [Ecological city](../spec.md)

## What to build

Introduce the complete energy model without invalidating established cities or offline simulation.

## Acceptance criteria

- [x] Apply versioned migrations for all stage-2 source state and preserve buildings, Citizens, inventory and production progress.
- [x] Provide a visible pre-transition diagnostic and the agreed adaptation period before new constraints fully apply.
- [x] Integrate changing generation, storage, dispatch, costs and shortages at relevant time boundaries through the pure injected-clock core.
- [x] Respect the 48-game-hour catch-up limit; verify equivalent elapsed-time simulation produces equivalent results across day/night and adaptation boundaries.
- [x] Cover old saves, new-format round trips, import/export, Time skip and prolonged deficits with regression fixtures.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/advance.ts; commands.ts; src/persistence/; ecology.test.ts; skipTime.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
