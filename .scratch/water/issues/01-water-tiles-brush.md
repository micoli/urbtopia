# Water tiles and brush

Status: ready-for-agent
Blocked by: none
Spec: ../spec.md

## What to build

Water tiles can be laid and removed on free owned land with a brush, rendered with the Nature Kit `ground_riverOpen` tile, and saved.

## Acceptance criteria

- [ ] `waterTiles` is an optional list in `GameState`; saves without it load unchanged.
- [ ] A brush lays Water tiles on free tiles of owned Parcels (no building, road, field or nature element) for 30 Urbs per tile, unlocked at 40 Citizens.
- [ ] Removing is free, and refused when a Boat or Bridge sits on the tile (see issue 03 and 06 for the later rules; the refusal hook exists now).
- [ ] The tile is rendered in the world and shown in the build menu; FR/EN strings.
- [ ] Core logic covered by tests in `src/core`.
