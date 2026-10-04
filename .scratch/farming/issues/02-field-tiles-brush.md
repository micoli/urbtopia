# Field tiles and drag brush

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

A drag brush tool, a new interaction pattern, used here to lay and remove Field tiles on free owned tiles. Placement costs Urbs per tile and is capped by the Farm's Tier.

## Acceptance criteria

- [ ] Brush tool kind in `src/tools/tools.ts` handles drag with mouse and touch, with a ghost preview of the affected tiles.
- [ ] Commands to lay and remove Fields; invalid tiles (outside owned Parcels, building, road, nature element) are skipped.
- [ ] Laying costs 5 Urbs per tile, removing is free; laying stops when the Farm's Field cap or the Urbs run out.
- [ ] Removing a Field removes any planted Crop with no refund (no Crop exists yet, but the rule is encoded).
- [ ] Fields are saved and rendered (instanced) in the scene.
- [ ] Tests for placement validity, cap and cost.
