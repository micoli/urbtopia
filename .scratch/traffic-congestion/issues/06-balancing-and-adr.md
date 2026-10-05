# Balancing and ADR

Status: resolved
Blocked by: 02, 03, 04, 05

## What to build

Tune values and record the decision.

## Acceptance criteria

- [x] `.scratch/traffic-congestion/balancing.md`: Lane capacities (start 6 / 14 / 24 per tile), Road tier prices, penalty cap, Adaptation duration
- [x] ADR 0011 written (`docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md`); review it against the final implementation
- [x] `vehicle-traffic/spec.md` points to the new spec
- [x] Playtest by measurement (headless autoplayer city, see `balancing.md`) and by eye in the dev server on a saturated tiered road and a disconnected road

## Comments

## Answer

- Values changed from the spec's starting point: capacities 100 / 250 / 500 (not 6 / 14 / 24), upgrade prices 8 / 20 per tile, penalty cap 25. Measurements and limits in `balancing.md`.
- ADR 0011 reviewed against the implementation: still accurate (core model, per-Home aggregation, capped penalty, Adaptation period for saved cities, Vehicles as a projection).
- Not a real human playtest: no tester played a full session; figures come from the autoplayer and screenshots.
