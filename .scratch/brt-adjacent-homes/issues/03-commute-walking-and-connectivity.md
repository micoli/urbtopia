# BRT-only access in Commute, walking and connectivity

Status: ready-for-agent
Blocked by: 01

## What to build

A building reached only by BRT has no car Commute and no Pedestrian path, and a BRT-only Home with no covering station is marked disconnected (core). See [spec](../spec.md).

## Acceptance criteria

- [ ] A BRT-only Home has empty road `access` in `congestion.ts` and no sidewalk node in `pedestrianGraph.ts` `accessNodes`
- [ ] A BRT-only Home covered by no BRT station is flagged disconnected: red cross, maximum Congestion; covered by a station it is not
- [ ] Buildings served by a Road behave exactly as before
- [ ] Deterministic across calls and catch-up
- [ ] Unit tests: no Commute, no walking trip, disconnected with and without a station (prior art: `congestion.test.ts`, `walkingCommute.test.ts`)

## Comments
