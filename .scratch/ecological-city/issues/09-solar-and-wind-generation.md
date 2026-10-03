# Add solar Homes, solar installations and explicit wind generation

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 01, 02, 08
Spec: [Ecological city](../spec.md)

## What to build

Introduce visible renewable generation and deterministic production cycles.

## Acceptance criteria

- [x] Offer more expensive solar variants using building-type-j/u/b and paid visible panel retrofits; every visible solar panel corresponds to generation.
- [x] Add standalone neighborhood solar installations with larger production and a land-use cost.
- [x] Identify existing windmill Power plants as wind sources with agreed Tier behavior.
- [x] Compute solar day/night output and predictable wind output using injected game time; expose forecasts.
- [x] Version source state and map existing solar-looking Homes and windmill plants according to ticket 01 without removing buildings or charging unexpected Urbs.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/energy.ts; src/scene/renderItems.ts; src/persistence/migrations.ts. See [delivery validation](../validation.md) for checks and practical limits.
