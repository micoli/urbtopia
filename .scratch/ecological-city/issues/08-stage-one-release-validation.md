# Validate the management and green-space stage

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 1
Blocked by: 07
Spec: [Ecological city](../spec.md)

## What to build

Prove the first playable stage meets the approved outcomes before its release.

## Acceptance criteria

- [x] Exercise small reference cities from ticket 01 and adjust the shared balancing table with recorded outcomes.
- [x] Check local overlap/connectivity, meaningful insulation savings and concrete well-being benefits without infinite stacking.
- [x] Verify existing-save migration, import/export and new-game/tutorial behavior.
- [x] Check all HUD layouts, keyboard/touch interactions and FR/EN; run relevant core/save/asset checks and project build/lint.
- [x] Record validation evidence and remaining limitations; update stage completion and domain documentation.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: validation.md; ecology.test.ts; MaximalStats.test.tsx. See [delivery validation](../validation.md) for checks and practical limits.
