# Teach sobriety and local green-space benefits

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 1
Blocked by: 04, 05, 06
Spec: [Ecological city](../spec.md)

## What to build

Introduce the first ecological choices early through short practical objectives.

## Acceptance criteria

- [x] Integrate early insulation and green-space unlocks with existing Citizens-based progression.
- [x] Add short objectives to insulate a Home and place green space near Citizens; completion follows actual effects rather than mere clicks.
- [x] Explain diminishing returns and the distinction between energy savings and environmental benefits.
- [x] Preserve tutorial skipping and existing progress; use FR/EN text appropriate to touch and desktop.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/ui/MaximalStats.tsx; src/core/ecology.ts; DismissEcology command. See [delivery validation](../validation.md) for checks and practical limits.
