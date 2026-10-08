# Access modes: data, placement and rotation

Status: ready-for-agent
Blocked by: none

## What to build

Buildings declare the networks they can be reached from, and placement accepts a BRT corridor tile in front of a compatible building (core, pure). See [spec](../spec.md) and [ADR 0017](../../../docs/adr/0017-building-access-modes.md).

## Acceptance criteria

- [ ] `accessModes: ('road' | 'brt')[]` added to `buildingDefinition.ts` and `buildingSpecs.ts`; an entry without it behaves as `['road']` when `requiresRoad` is true
- [ ] Home, Leisure, Shop and Public facility entries of `assets/buildings.json` get `['road', 'brt']`; all others unchanged
- [ ] `frontTouchesRoad` generalized in `placement.ts`: valid when any accepted mode has a tile in front (Road via `isRoadLike`, BRT via `state.brtRoads`); rail tiles never validate
- [ ] `defaultRotation` prefers a road front, then a BRT front
- [ ] Non-compatible types still return `error.needsRoad`; compatible ones return a "road or BRT" wording
- [ ] Unit tests: road only, BRT only, both, neither; rotation priority; rail never validates; non-compatible types refused (prior art: `placement.test.ts`)

## Comments
