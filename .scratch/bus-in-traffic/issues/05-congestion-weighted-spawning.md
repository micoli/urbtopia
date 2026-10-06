# Cars spawn on saturated roads

Status: resolved
Blocked by: none

## What to build

Weight car spawning by the congestion ratio of each section so the model's jams are visible.

## Acceptance criteria

- [x] Spawn tile weight grows above ratio 1, with a floor so quiet roads keep cars
- [x] Pure weighting helper, deterministic with the seeded random
- [x] Scene only, no change to the core
- [x] Unit tests: weights, floor, saturated roads picked more often

## Comments

## Answer

`src/scene/trafficSpawn.ts`: `spawnWeight` (floor 1, plus 4 at ratio 2), `cumulativeWeights`, `pickByWeight`. `TrafficLayer.sync` recomputes the weights from the congestion sections each time and `randomRoadTile` draws with them, using the seeded random. Scene only. Tests in `trafficSpawn.test.ts`.
