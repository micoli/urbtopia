# Refuse removing the last access of a building

Status: resolved
Blocked by: 01

## What to build

Removing a Road or a BRT corridor tile is refused when a building would lose its last access mode (core). See [spec](../spec.md).

## Acceptance criteria

- [x] `demolishRoad` in `commands.ts` and the BRT removal command check every building with accepted access modes, stations excluded as today
- [x] `error.lastRoadOfBuilding` generalized to a last-access error with an adapted message
- [x] A building touching both a Road and a BRT is only orphaned when both are gone
- [x] Unit tests: last road refused, last BRT tile refused, one of two accesses allowed (prior art: `roads.test.ts`)

## Comments
