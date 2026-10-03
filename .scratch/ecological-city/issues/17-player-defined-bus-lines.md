# Create and manage bus lines between selected stops

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 3
Blocked by: 16
Spec: [Ecological city](../spec.md)

## What to build

Let players connect roadside stops through useful road-based services.

## Acceptance criteria

- [x] Provide create/edit/delete line interactions with ordered stops and the agreed minimum viable route.
- [x] Validate road connectivity and routing between stops; reject or clearly disable disconnected services.
- [x] Handle stop deletion, road changes and line edits according to the documented service rules.
- [x] Persist line identities and stop order, show routes and render buses following valid road paths.
- [x] Keep decorative vehicle animation separate from authoritative simulation; verify deterministic route selection and save round trips.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/ui/BusLinesPanel.tsx; src/core/transport.ts; src/scene/EcologyLayer.ts. See [delivery validation](../validation.md) for checks and practical limits.
