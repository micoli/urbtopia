# Add paid Home insulation upgrades

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 1
Blocked by: 01
Spec: [Ecological city](../spec.md)

## What to build

Let players reduce Home energy Demand independently of solar generation.

## Acceptance criteria

- [x] Add an optional paid insulation action to new and existing eligible Homes using the agreed costs and Tier rules.
- [x] Show baseline Demand, reduced Demand and energy saved in Home details and MaximalStats.
- [x] Insulation and solar remain independent, with no negative Demand or duplicate purchase benefit.
- [x] Preserve insulation when upgrading a Home according to the balancing contract; sale and move follow documented rules.
- [x] Version and migrate affected saves; verify old Homes retain Citizens, Tier and progress and new insulation round-trips.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/commands.ts; ecology.ts; src/ui/HomePanel.tsx; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
