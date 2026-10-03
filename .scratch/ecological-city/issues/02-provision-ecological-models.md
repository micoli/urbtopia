# Provision ecological building and transport assets

Type: task
Status: ready-for-agent
Completion: completed
Stage: Preparation
Blocked by: 
Spec: [Ecological city](../spec.md)

## What to build

Make the named visual assets available through the existing offline asset pipeline.

## Acceptance criteria

- [x] Verify building-type-j, building-type-u and building-type-b in source packs and record their exact runtime keys and dimensions.
- [x] Provision industrial solar panels and windmills, trees, small parks, batteries, backup generation, buses and visible stop signs from available packs; identify missing models explicitly.
- [x] Register required models and textures through the existing asset registry and extraction scripts with licensing credits.
- [x] Verify solar retrofit attachment placement and roadside stop-sign visibility at normal desktop and mobile zoom.
- [x] Run the existing asset consistency checks; document any proposed substitute before a dependent feature relies on it.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Ready for scoped preparation work.


Implementation completed. Evidence: scripts/assetPacks.ts; src/scene/renderItems.ts; EcologyLayer.ts; asset registry tests. See [delivery validation](../validation.md) for checks and practical limits.
