# Explain public transport coverage and efficiency

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 3
Blocked by: 18
Spec: [Ecological city](../spec.md)

## What to build

Make useful transport service and its environmental tradeoffs understandable.

## Acceptance criteria

- [x] Show served Citizens/activity locations, usage, operating costs, traffic reductions and transport emissions in MaximalStats.
- [x] Explain overlap without double counting and identify ineffective lines or uncovered destinations.
- [x] Add an early transport-stage objective to connect a residential area with an activity area through signed stops.
- [x] Display route/stop details and useful improvement advice in FR/EN across desktop, tablet and phone.
- [x] Extend the existing indicator framework rather than introducing an opaque combined ecological score.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/ui/MaximalStats.tsx; BusLinesPanel.tsx; FR/EN messages. See [delivery validation](../validation.md) for checks and practical limits.
