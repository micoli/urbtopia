# Walking commute

Status: resolved
Blocked by: 01

## What to build

Commuters whose job assignment has a pedestrian path under the work threshold walk instead of drive, removing them from the road load.

## Acceptance criteria

- [x] Job assignment unchanged (nearest first, stable order); mode chosen per assignment
- [x] Work walking threshold (10) in `GAME_CONFIG`
- [x] Walking Commuters add no car load and no Congestion penalty
- [x] Modal shift only draws from car Commuters: a Rider is never also a walker
- [x] Statistics expose walking Commuters and the mode shares (car, public transport, walking) summing to 100%
- [x] Existing statistics keep their meaning; old tests still pass
- [x] Unit tests: walker removed from load, no walker also a Rider, determinism across calls and catch-up

## Comments

## Answer

`src/core/traffic/walking.ts` (`WALKING.workThreshold` 10, `modeShares`). `calculateCongestion` walks each job assignment whose workplace is reachable on the pedestrian graph under the threshold; walkers add no car load. `HomeCongestion.walkers`, `CongestionStats.walkers` and `modes {car, transit, walking}`. `commuters` now means car Commuters, so Modal shift only draws from them. Threshold 0 disables walking (used by the existing car tests). Cache stays keyed by `state.roads` (a Crossing change replaces it). Tests in `walkingCommute.test.ts`.
