# Crossing capacity effect

Status: resolved
Blocked by: 02, 03

## What to build

Pedestrian load on a Crossing reduces the capacity of its road tile, so the player trades road throughput for walkability.

## Acceptance criteria

- [x] `effectiveCapacity = capacity × (1 - min(cap, k × pedestrians))`, `cap` 0.6 and `k` in `GAME_CONFIG`
- [x] Ratio, bottleneck and saturated sections use `effectiveCapacity`
- [x] An unused Crossing has no effect
- [x] Saturated Crossings counted in the statistics
- [x] Commuters who no longer walk (Crossing removed) are back on the road load
- [x] Unit tests: cut, cap, unused Crossing, saturation, determinism

## Comments

## Answer

`WALKING.crossingCutPerPedestrian` (0.015) and `maxCrossingCut` (0.6), `crossingCut(pedestrians)`. Section capacity is `laneCapacity(tier) * (1 - cut)` so ratio, bottleneck and saturated sections use it. `CongestionStats.crossings` (pedestrians, cut, saturated per used Crossing) and `saturatedCrossings` (cut at the maximum). Unused Crossings are absent from the map and cost nothing. Tests in `crossingCapacity.test.ts`.
