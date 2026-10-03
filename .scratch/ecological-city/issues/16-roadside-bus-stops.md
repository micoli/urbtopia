# Place visible bus-stop signs beside roads

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 3
Blocked by: 01, 02, 15
Spec: [Ecological city](../spec.md)

## What to build

Give every transport stop a visible roadside sign and a measurable local catchment.

## Acceptance criteria

- [x] Add stop placement beside roads with documented costs, footprint and unlock threshold.
- [x] Render a visible sign for every stop and show nearby Homes/activity locations covered on selection.
- [x] Support moves/removal and road edits according to the invalidation rules from ticket 01.
- [x] Add persisted stop identity/location with a versioned migration and verify old cities remain intact.
- [x] Check touch selection and sign visibility without blocking existing roads or building interaction.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/commands.ts; src/scene/EcologyLayer.ts; src/persistence/validate.ts. See [delivery validation](../validation.md) for checks and practical limits.
