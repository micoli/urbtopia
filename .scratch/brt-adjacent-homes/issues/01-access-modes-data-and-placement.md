# Access modes: data, placement and rotation

Status: resolved
Blocked by: none

## What to build

Buildings declare the networks they can be reached from, and placement accepts a BRT corridor tile in front of a compatible building (core, pure). See [spec](../spec.md) and [ADR 0017](../../../docs/adr/0017-building-access-modes.md).

## Acceptance criteria

- [x] `accessModes: ('road' | 'brt')[]` added to `buildingDefinition.ts` and `buildingSpecs.ts`; an entry without it behaves as `['road']` when `requiresRoad` is true
- [x] Home, Leisure, Shop and Public facility entries of `assets/buildings.json` get `['road', 'brt']`; all others unchanged
- [x] `frontTouchesRoad` generalized in `placement.ts`: valid when any accepted mode has a tile in front (Road via `isRoadLike`, BRT via `state.brtRoads`); rail tiles never validate
- [x] `defaultRotation` prefers a road front, then a BRT front
- [x] Non-compatible types still return `error.needsRoad`; compatible ones return a "road or BRT" wording
- [x] Unit tests: road only, BRT only, both, neither; rotation priority; rail never validates; non-compatible types refused (prior art: `placement.test.ts`)

## Comments
