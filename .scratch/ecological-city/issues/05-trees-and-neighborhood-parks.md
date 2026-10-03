# Build trees and small neighborhood parks

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 1
Blocked by: 01, 02
Spec: [Ecological city](../spec.md)

## What to build

Add green spaces as paid land-use choices rather than free global modifiers.

## Acceptance criteria

- [x] Add trees and small parks to construction with the agreed footprints, costs, early unlocks and placement rules.
- [x] Render the selected assets and support selection, move and sale under the documented rules.
- [x] Compute local coverage and connected-space bonuses from positions; apply overlap rules and diminishing returns.
- [x] Keep cooling, biodiversity and well-being separate and apply their agreed practical benefits without canceling emissions.
- [x] Persist only source state, migrate existing saves and verify relocation/removal updates derived benefits.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/ecology.ts; buildingSpecs.ts; src/scene/renderItems.ts; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
