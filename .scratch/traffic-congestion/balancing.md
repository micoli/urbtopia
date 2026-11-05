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
| Commuters of a Home | Citizens who drive: the others walk, cycle or ride (see [job-search-by-travel-time](../job-search-by-travel-time/spec.md)) |
| Jobs per workplace | Workshop 25 × Tier; Factory 25 × Tier; Shop 15; Casino 15 × Tier; Public facility capacity ÷ 40 (Town hall 40) |
| Job filling | Every Citizen looks for a Job (ADR 0059): Walkers, then Cyclists, then the others by travel time, across the whole city, ties by Home id then workplace id; Citizens left without a Job are Unemployed and do not drive |
| Modal shift | Retired by ADR 0059: the car's travel time follows the Congestion (two passes), so a saturated road sends Citizens to a faster line by itself. The old values were: up to 50% of driving Commuters, Riders up to 90% of a Home (usual cap 70%) |
| Car speed, tier 1 / 2 / 3 | 2 / 2.5 / 3 tiles per minute (`assets/defs/balance/traffic.json`, `roadSpeeds`); slowed to at most half by a saturated section |
| Travel time on foot / by bicycle | Path cost in minutes (1 per tile); by bicycle the same cost divided by 3 |
| Travel time by public transport | Walk to the stop, half a headway of wait, ride at the line's speed (bus 2, BRT 3, rail 5, Metro 6 tiles per minute) with half a minute per stop, Transfers, walk from the last stop |
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
- The headless autoplayer builds no Bus line, so its measurements above have no modal shift; the shift is covered by `modalShift.test.ts` on a hand-built city with lines.

## Job search by travel time (ADR 0059)

Measured on the new Commute, at the end of the implementation; no earlier measurement exists for the two sample cities, so only the "Robbart" save (r354) has a before and an after.

| City | Citizens | Jobs | Walking | Cycling | Public transport | Car | Unemployed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Robbart, before | 1000 | 951 | 260 | 40 | 700 (fixed 70%, no Job) | 0 | 0 (651 Jobs unfilled) |
| Robbart, after | 1000 | 951 | 741 | 210 | 0 | 0 | 49 (every Job filled) |
| `idealCity`, after | 2000 | n/a | 1526 | 440 | 0 | 34 | 0 |
| `evolvedCity`, after | 1752 | n/a | 198 | 687 | 0 | 682 | 185 |

`congestionStats` takes 1 to 9 ms on these cities, in the range it took before.

Findings to act on in the balancing pass:

- **Public transport carries nobody in all three cities.** Walking and cycling take every Job within 30 path tiles (3 × the walking threshold) before any Rider is considered, and a car beats a bus or a Metro on trips under about 15 tiles once the wait and the walks to the stops are added. The Metro needs longer trips, a higher car cost or a shorter wait to appear in the mix. Candidate levers: the cycling factor (3), the car speeds, the Metro headways, a parking or access time for the car.
- **Cycling is generous** because the whole walking graph is a cycleway (ADR 0038) and the cycling threshold is 30; it empties the car and transit shares in dense cities.
- Objectives, Sanctions and the congestion Well-being penalty read the car share and the Congestion index: they must be replayed after any change to the levers above.
