# Traffic congestion balancing

Status: Provisional values, tunable without changing the rules. Source of truth in code: `src/core/traffic/roadTier.ts` (`CONGESTION`, `ROAD_TIER_COSTS`).

## Values

| Quantity | Value |
| --- | --- |
| Lane capacity per tile, Road tier 1 / 2 / 3 (1 / 2 / 3 Lanes per direction) | 100 / 250 / 500 Commuters |
| Road tier upgrade price, per tile | tier 1 → 2: 8 Urbs; tier 2 → 3: 20 Urbs (a new road tile costs 2) |
| Congestion ratio | load ÷ capacity on the bottleneck of a Home's Commute, clamped to 2 |
| Well-being penalty | 0 up to ratio 1, then linear to 25 points at ratio 2 (cap) |
| Disconnected Home | ratio 2, so the 25-point cap |
| Adaptation period | 24 game hours, only for cities migrated from save version 10 or older |
| Commuters of a Home | Citizens minus Riders of public transport |
| Vehicles | 1 per 10 Commuters, at most 1 per 2 lane tiles, 150 (75 on touch) |

The penalty feeds Tax through `wellbeingTaxFactor` (1 + Well-being / 500), so the cap costs a Home up to 5% of its Tax, the same order as missing services (cap 40, 8%).

## Measurements

Headless autoplayer city (seed `amber-fox-4821`, no Bus line, roads never upgraded), Commuters = all Citizens:

| Citizens | Busiest tile load | Index (tier 1) | Penalty |
| ---: | ---: | ---: | ---: |
| 192 | 103 | 1.03 | 0 |
| 420 | 235 | 2.00 | 25 |
| 1200 | 680 | 2.00 | 25 |
| 2656 | 1590 | 2.00 | 25 |

At 2656 Citizens all roads at tier 3 still leave 28 saturated tiles (load 1590 against 500). Public transport carries up to 70% of Citizens, which brings the busiest tile to about 480, under the tier 3 capacity. The intended design follows: Lanes alone relieve a small or medium city, a large one needs the public transport mix.

## Known limits and follow-ups

- The load model sends every Commuter of a Home toward every workplace by the shortest path, so a single trunk road concentrates most of the flow. Parallel roads only help if they offer a shorter or equal path; ties are resolved by exploration order, not by load balancing.
- Capacity ignores direction; Lanes per direction are a presentation of the tier.
- Limited jobs ([ticket 01](issues/01-limited-jobs.md)) and dynamic modal shift ([ticket 07](issues/07-dynamic-modal-shift.md)) would change these figures.
