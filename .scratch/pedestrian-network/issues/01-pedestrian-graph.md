# Pedestrian graph and walking paths

Status: resolved
Blocked by: none

## What to build

Pure core module that builds the pedestrian graph from the road layout (two Sidewalk sides per road tile) and computes walking path lengths from a Building to a destination.

## Acceptance criteria

- [x] Each road tile has two sides; sides connect along the road, around Intersection corners on the same side, and around Roundabout rings on the outside
- [x] The two sides of a tile connect only at a Crossing tile or at a dead end; nothing else is crossable
- [x] A Building attaches to the side of the road tile in front of it (`frontTiles`)
- [x] Path cost = tiles walked + 2 per Crossing crossed; shortest path, stable tie-breaks
- [x] Unreachable destination returns none
- [x] Pure and deterministic; cached with `layoutSignature` extended to Crossings
- [x] Unit tests: sides, corners, dead end, roundabout, missing Crossing, determinism

## Comments

## Answer

`src/core/map/pedestrianGraph.ts`: nodes are `tile:side` (N/E/S/W on the free edges of a road tile, `R` on roundabout ring tiles). Edges along the road, around corners (outer and inner), at dead ends, at Crossings (cost 1 + 2) and around roundabouts. `walkFrom` (bucketed Dijkstra), `nearestTarget`, `crossingsOnPath`, `accessNodes`. Cached per `state.roads`. Tests in `pedestrianGraph.test.ts`.
