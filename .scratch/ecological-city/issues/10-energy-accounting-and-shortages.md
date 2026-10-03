# Simulate economic energy Demand and shortage allocation

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 2
Blocked by: 09
Spec: [Ecological city](../spec.md)

## What to build

Replace the electricity hard-cap invariant with time-aware allocation while retaining existing water rules.

## Acceptance criteria

- [x] Add agreed energy Demand to economic buildings, especially Workshops and Factories; retain independent water placement/capacity behavior.
- [x] Account for generation, Home self-consumption and unmet Demand through a single deterministic energy ledger reusable by sharing/storage/backup.
- [x] Allow temporary electricity deficits at placement, upgrade and sale; prioritize Homes and proportionally reduce economic activity afterward.
- [x] Apply documented Home satisfaction effects and reduced production without destroying buildings or losing queued work.
- [x] Replace obsolete electricity invariant checks with meaningful accounting/allocation tests, including zero Demand and partial supply.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/energy.ts; advance.ts; production.ts; utilityInvariant.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
