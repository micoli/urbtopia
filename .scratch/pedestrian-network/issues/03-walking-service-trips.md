# Walking trips to services

Status: resolved
Blocked by: 01

## What to build

Each Home generates walking trips to shops, schools, health, culture, casino and parks. They add no car demand, give Well-being, and load the Crossings on their path.

## Acceptance criteria

- [x] Per-type weight and threshold in `GAME_CONFIG` (shop 12, school / health / culture 15, park 20)
- [x] Nearest destination reachable on foot under the threshold, no destination capacity
- [x] Parks and nature count as destinations for walking only
- [x] No car load added by these trips
- [x] Well-being benefit for Homes with walking access, with a cap
- [x] Crossing load per tile exposed in the statistics
- [x] Statistics expose walking trips by service type
- [x] Unit tests: threshold, weight, no car load, Well-being, Crossing load, determinism

## Comments

## Answer

`walking.ts` holds `WALKING` (`enabled`, per-kind `thresholds`, `tripsPerCitizen`, `wellbeingBonus`); `walkingTrips.ts` finds the nearest reachable destination per kind from a Home, using `adjacentNodes` (any side of the footprint touching a road). Destinations: shop, schools, hospital, theatre/concert hall/community hall, casino, non-habitat vegetation. `CongestionStats.walkingTrips` and `pedestrians` (per Crossing tile); `HomeCongestion.walkAccess` (0..1). `homeBenefits` adds `walkingBonus` (integer points, capped at the Well-being limit). `WALKING.enabled = false` is used by car, services, casino and catch-up tests so they stay about their own rules. Tests in `walkingTrips.test.ts`.
