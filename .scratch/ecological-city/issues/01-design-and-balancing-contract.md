# Define ecological rules and initial balancing tables

Type: task
Status: ready-for-agent
Completion: completed
Stage: Preparation
Blocked by: 
Spec: [Ecological city](../spec.md)

## What to build

Turn the approved conceptual design into explicit implementation rules without choosing undocumented behavior inside feature code.

## Acceptance criteria

- [x] Document costs, unlock thresholds, radii, curves, benefit caps and reference-city scenarios for all three stages in balancing.md; mark initial values as provisional.
- [x] Define energy units and time integration, battery charge/discharge order and rates, dispatch order, operating-cost cadence, insufficient-Urbs behavior and existing-city adaptation duration.
- [x] Define well-being, attractiveness and economic benefits, activity emissions, green-space connectivity and diminishing returns, insulation by Tier and bus coverage/usage formulas.
- [x] Specify day/night and predictable wind cycles, shared-surplus recipient ordering, forecast horizon and accounting of battery and backup energy without double counting.
- [x] Document the stage-1 baseline before full economic energy Demand exists, existing solar-model treatment at stage-2 migration, and stop/line invalidation when roads change.
- [x] Update CONTEXT.md and add relevant ADRs; reconcile Home Tier count and identify superseded global-energy and decorative-Traffic decisions.
- [x] Keep unsettled product choices explicit for review; downstream tickets only proceed once their required rules are settled.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Ready for scoped preparation work.


Implementation completed. Evidence: balancing.md; CONTEXT.md; ADR 0005. See [delivery validation](../validation.md) for checks and practical limits.
