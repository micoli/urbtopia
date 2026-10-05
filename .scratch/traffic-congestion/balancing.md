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
| Jobs per workplace | Workshop 25 × Tier; Factory 25 × Tier; Shop 15; Casino 15 × Tier; Public facility capacity ÷ 40 (Town hall 40) |
| Job filling | Homes in id order take the nearest workplaces first; Commuters left without a Job do not drive |
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

## Jobs measurements

Same autoplayer city, roads never upgraded, no Bus line:

| Citizens | Jobs | Commuters driving | Without a job | Index | Penalty |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 192 | 476 | 192 | 0 | 0.64 | 0 |
| 420 | 882 | 420 | 0 | 1.18 | 8.7 |
| 1200 | 1821 | 1200 | 0 | 2.00 | 25 |
| 2656 | 2369 | 1473 | 1183 | 1.24 | 15.5 |

Jobs are plentiful early and run short in a large city that stopped building workplaces. With all roads at tier 3 the final city drops to index 0.87 and a 6.2 penalty, so Lanes alone now nearly suffice before public transport.

## Known limits and follow-ups

- The load model sends every Commuter of a Home toward every workplace by the shortest path, so a single trunk road concentrates most of the flow. Parallel roads only help if they offer a shorter or equal path; ties are resolved by exploration order, not by load balancing.
- Capacity ignores direction; Lanes per direction are a presentation of the tier.
- Dynamic modal shift ([ticket 07](issues/07-dynamic-modal-shift.md)) would change these figures.
