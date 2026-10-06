# Crossing capacity effect

Status: ready-for-agent
Blocked by: 02, 03

## What to build

Pedestrian load on a Crossing reduces the capacity of its road tile, so the player trades road throughput for walkability.

## Acceptance criteria

- [ ] `effectiveCapacity = capacity × (1 - min(cap, k × pedestrians))`, `cap` 0.6 and `k` in `GAME_CONFIG`
- [ ] Ratio, bottleneck and saturated sections use `effectiveCapacity`
- [ ] An unused Crossing has no effect
- [ ] Saturated Crossings counted in the statistics
- [ ] Commuters who no longer walk (Crossing removed) are back on the road load
- [ ] Unit tests: cut, cap, unused Crossing, saturation, determinism

## Comments
