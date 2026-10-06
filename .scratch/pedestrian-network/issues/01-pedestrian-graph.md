# Pedestrian graph and walking paths

Status: ready-for-agent
Blocked by: none

## What to build

Pure core module that builds the pedestrian graph from the road layout (two Sidewalk sides per road tile) and computes walking path lengths from a Building to a destination.

## Acceptance criteria

- [ ] Each road tile has two sides; sides connect along the road, around Intersection corners on the same side, and around Roundabout rings on the outside
- [ ] The two sides of a tile connect only at a Crossing tile or at a dead end; nothing else is crossable
- [ ] A Building attaches to the side of the road tile in front of it (`frontTiles`)
- [ ] Path cost = tiles walked + 2 per Crossing crossed; shortest path, stable tie-breaks
- [ ] Unreachable destination returns none
- [ ] Pure and deterministic; cached with `layoutSignature` extended to Crossings
- [ ] Unit tests: sides, corners, dead end, roundabout, missing Crossing, determinism

## Comments
