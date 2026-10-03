# Validate transport and the complete ecological city

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 3
Blocked by: 19
Spec: [Ecological city](../spec.md)

## What to build

Verify the third playable stage and the full cross-feature experience.

## Acceptance criteria

- [x] Validate reference cities with overlapping bus lines, scarce Urbs, mixed generation and connected/disconnected green spaces.
- [x] Confirm meaningful cost/benefit tradeoffs, bounded effects and a playable polluting city; record balancing outcomes.
- [x] Check integrated saves, migration, tutorial skipping, FR/EN and all HUD layouts with touch and keyboard.
- [x] Run relevant simulation/catch-up/save/asset checks, build and lint; inspect rendering performance with buses and ecological overlays.
- [x] Update CONTEXT.md and affected legacy specs/ADRs to reflect delivered behavior, retaining historical decisions as superseded where appropriate.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: validation.md; CONTEXT.md; ADR 0005; updated legacy specifications. See [delivery validation](../validation.md) for checks and practical limits.
