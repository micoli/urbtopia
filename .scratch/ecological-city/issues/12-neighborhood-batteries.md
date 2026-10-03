# Store renewable energy in neighborhood batteries

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 11
Spec: [Ecological city](../spec.md)

## What to build

Shift available energy through time using finite paid storage.

## Acceptance criteria

- [x] Add paid batteries with visible assets, agreed range, capacity and charge/discharge limits.
- [x] Integrate batteries into the agreed ledger order; draw charging energy only from accounted surplus and release only stored energy.
- [x] Persist stored energy and verify that moves, upgrades and sales follow the contract without creating energy.
- [x] Show stored amount, charging/discharging state and limits in battery details and MaximalStats.
- [x] Verify capacity bounds and energy conservation across daytime, nighttime, overlapping neighborhoods and catch-up.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/energy.ts; advance.ts; src/ui/EcologicalBuildingPanel.tsx; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
