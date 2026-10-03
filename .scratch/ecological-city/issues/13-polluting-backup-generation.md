# Add dispatchable backup generation with costs and emissions

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 12
Spec: [Ecological city](../spec.md)

## What to build

Provide a reliable but costly polluting fallback that preserves the incentive to save and store energy.

## Acceptance criteria

- [x] Add a clearly distinct backup Power plant and integrate its dispatch after the agreed renewable/storage priorities.
- [x] Charge operating costs from actual operation at the agreed cadence; handle insufficient Urbs deterministically.
- [x] Calculate emissions from delivered backup generation and expose costs and emissions separately from renewable output.
- [x] Include agreed activity emissions and explain their drivers; green spaces never erase industrial emissions.
- [x] Verify dispatch avoids unnecessary operation and never supplies or charges the same demand twice.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/energy.ts; advance.ts; src/ui/MaximalStats.tsx; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
