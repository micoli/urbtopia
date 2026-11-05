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
| Car speed, tier 1 / 2 / 3 | 1.5 / 2 / 2.5 tiles per minute (`assets/defs/balance/traffic.json`, `roadSpeeds`); slowed to at most half by a saturated section |
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

Balancing pass of ticket 10 of [job-search-by-travel-time](../job-search-by-travel-time/spec.md). Before is the commit before the rule (`047d2f23`), after is the final values.

### The three cities

| City | | Citizens | Jobs | Walking | Cycling | Public transport | Car | Unemployed | Congestion index | Saturated sections | Emissions | Temperature (°C) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Robbart (r354, Metro) | before | 1000 | 951 | 260 | 40 | 700 | 0 | 0 | 0 | 0 | 0 | 26.14 |
| | after | 1000 | 951 | 741 | 210 | 0 | 0 | 49 | 0 | 0 | 0 | 26.14 |
| `idealCity` (no line) | before | 2000 | 2383 | 1070 | 733 | 0 | 197 | 0 | 0.153 | 0 | 19.7 | 26.23 |
| | after | 2000 | 2383 | 1526 | 440 | 0 | 34 | 0 | 0.021 | 0 | 3.4 | 26.06 |
| `evolvedCity` (no line) | before | 1752 | 1567 | 80 | 308 | 0 | 1179 | 185 | 1.792 | 53 | 117.9 | 40.00 |
| | after | 1752 | 1567 | 198 | 687 | 0 | 682 | 185 | 1.092 | 22 | 68.2 | 39.62 |

`congestionStats` takes 1 to 9 ms on these cities.

What the table says:

- **`idealCity` and `evolvedCity` have no public transport line**, so a 0 in their transit column proves nothing. An earlier note blamed the rule for it; that was wrong.
- **Robbart rides nobody**: its Homes and workplaces are all within 30 path tiles, so Walkers and Cyclists take every Job before a Rider is considered. This is the rule (Walkers, then Cyclists, first), not a defect; the Metro matters once Jobs are farther than the cycling range.
- **Congestion falls in the congested city** (index 1.79 to 1.09, saturated sections 53 to 22, emissions 118 to 68) because Citizens now take the Job they reach fastest instead of the first Home in id order taking the nearest Jobs.
- **Unemployed is a statistic** (49 in Robbart, 185 in `evolvedCity`, which already had 185).

### Where public transport wins

Synthetic city: 250 Citizens (Home tier 8) on one side, a Factory with 200 Jobs on the other, one road, one line with 4 vehicles and a stop beside each end. Share of the Jobs filled by Riders, by distance between Home and Factory.

| Car speed (tier 1 / 2 / 3) | Line, road tier | 35 tiles | 50 tiles | 80 tiles |
| --- | --- | ---: | ---: | ---: |
| 2 / 2.5 / 3 (first values) | bus, tier 1 | 0% | 0% | 0% |
| | rail, tier 1 | 100% | 100% | 100% |
| | rail, tier 3 | 0% | 0% | 100% |
| **1.5 / 2 / 2.5 (kept)** | bus, tier 1 | 30% | 60% | 60% |
| | bus, tier 3 | 0% | 0% | 0% |
| | rail, tier 1 | 100% | 100% | 100% |
| | rail, tier 3 | 0% | 100% | 100% |
| 1.2 / 1.6 / 2 (tried) | bus, tier 1 | 60% | 60% | 60% |
| | rail, tier 3 | 100% | 100% | 100% |

The bus share stops at 60% because a bus line carries 120 Citizens. Up to 30 tiles everybody cycles, whatever the line.

With the first speeds a bus never beat a car, since both run at 2 tiles per minute on a tier 1 road and the bus also waits. The kept values make a bus useful on slow roads and a rail line useful on long trips, and leave a tier 3 road to the car on trips under 50 tiles. The slowest set makes public transport win everywhere; it was rejected for emptying the road too early.

The BRT could not be measured: the fixture's BRT line stayed inactive (no energy). It sits between the bus (2) and rail (5) in speed.

### What stays as is, and why

- **Cycling factor (3) and the walking threshold (10)**: they define the cycling range of 30 path tiles. The user asked for Cyclists to have priority; narrowing the range would be a separate decision.
- **The fixed wait**: a single vehicle on a long line waits about half its cycle (18 minutes in the synthetic city), so adding vehicles is what makes a line attractive. Left as is.
- **The congestion Well-being penalty, the objectives and the Sanctions** read the Congestion index and the car share. The index in the congested city fell, no threshold is crossed the other way, and the objective `congestion` (index) is reachable. No value was changed.

### Open

- No measurement of a large city with many vehicles on several line types: the autoplayer does not build lines.
- BRT, Metro and Transit hub in the synthetic city.
