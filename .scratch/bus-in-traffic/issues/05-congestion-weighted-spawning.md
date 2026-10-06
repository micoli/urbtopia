# Cars spawn on saturated roads

Status: ready-for-agent
Blocked by: none

## What to build

Weight car spawning by the congestion ratio of each section so the model's jams are visible.

## Acceptance criteria

- [ ] Spawn tile weight grows above ratio 1, with a floor so quiet roads keep cars
- [ ] Pure weighting helper, deterministic with the seeded random
- [ ] Scene only, no change to the core
- [ ] Unit tests: weights, floor, saturated roads picked more often

## Comments
