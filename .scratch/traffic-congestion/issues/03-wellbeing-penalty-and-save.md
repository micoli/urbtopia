# Well-being penalty and save

Status: resolved
Blocked by: 02

## What to build

Apply Congestion to Home Well-being and persist Road tiers.

## Acceptance criteria

- [x] Per-Home penalty: none up to 100% load, then linear, capped (constant in balancing)
- [x] Disconnected Homes take the maximum penalty
- [x] Adaptation period for already-saved cities; none for newly built Roads
- [x] Penalty exposed separately in `homeBenefits` / `cityBenefits` beside `pollutionPenalty`, and still modulates Tax
- [x] Road tier persisted with a save version migration; older saves load with tier 1 and an Adaptation period
- [x] Live ticks and catch-up agree (ADR 0002)
- [x] Vitest coverage including migration

## Comments

## Answer

- Penalty: `congestionPenaltyOf(ratio)` in `src/core/environment/wellbeing.ts`, cap `CONGESTION.penaltyCap` (20), linear from ratio 1 to `CONGESTION.maxRatio` (2). Exposed as `congestionPenalty` in `homeBenefits` / `cityBenefits`; skipped while `isAdapting`.
- Save version 11: migration 10 starts a 24 h Adaptation period; `RoadTile.tier` validated (1..3); frozen fixture `save-v11.json`; `saves/evolved-city.json` regenerated. Older migration tests now expect the added Adaptation period.
- A city with no road, or no workplace reachable by road anywhere, has no Commute and no congestion (avoids penalising test cities and empty starts). Disconnection only applies once a workplace is on the road network.
- `congestionStats` is memoised on the road layout plus Home/workplace signature, so `advance` steps stay cheap (autoplayer test back to its previous speed).
- Lane capacities scaled x10 (60 / 140 / 240) so a normal city is not saturated; final values belong to ticket 06.
