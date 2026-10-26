# Pedestrian Load Layers

Status: resolved
Spec: ../spec.md
Blocked by: 04

## What to build

Expose in the core the volume of walking trips per Sidewalk and Pedestrian way section (today only Crossings carry a load), without changing the Congestion model or its results. Add the Pedestrians Movement layer (volume relative to the city maximum, Crossings shown against their threshold) and All (Roads and Sidewalks together with two colour ramps, each normalised on its own maximum, two legends).

## Acceptance criteria

- [ ] Existing congestion and walking tests and saved-city snapshots unchanged.
- [ ] Pedestrian load per section tested on a small city with a Pedestrian way and a Crossing.
- [ ] All draws both ramps without hiding either.
- [ ] Two legends in All.
