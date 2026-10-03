# Explain ecological effects and city efficiency

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 1
Blocked by: 03, 04, 05
Spec: [Ecological city](../spec.md)

## What to build

Expose ecological cause and effect through separate transparent indicators.

## Acceptance criteria

- [x] Show green-space coverage, cooling, biodiversity, well-being and insulation savings with their contributors in MaximalStats.
- [x] Apply the agreed attractiveness, quality-of-life and economic effects; keep a polluting city playable.
- [x] Label ecological values as game indicators and explain their calculation without fictitious scientific units.
- [x] Give actionable local advice, including uncovered Homes and opportunities to reduce Demand; avoid a single opaque efficiency score.
- [x] Use the current stage's available inputs and extend rather than duplicate selectors in later energy and transport tickets.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/ui/MaximalStats.tsx; src/core/ecology.ts; FR/EN messages. See [delivery validation](../validation.md) for checks and practical limits.
