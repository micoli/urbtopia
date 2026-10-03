# Share solar surplus with nearby Homes

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 10
Spec: [Ecological city](../spec.md)

## What to build

Make local renewable distribution visible and strictly bounded.

## Acceptance criteria

- [x] Consume each Home's production locally first, then allocate only its surplus to eligible nearby Homes.
- [x] Respect the agreed radius and deterministic recipient ordering; recipients never receive more than their unmet Demand.
- [x] Prevent duplicate allocation when neighborhoods overlap, sources move or buildings are removed.
- [x] Visualize source, beneficiaries and transfer amounts on selection; expose local exchanges in MaximalStats.
- [x] Verify conservation and distance boundaries with overlapping sources and recipients.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/energy.ts; src/scene/EcologyLayer.ts; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
