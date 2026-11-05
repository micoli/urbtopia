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

### Three saved cities (final values)

Replayed with the final rule, including the exemption of Homes with no Road from the Unemployed count. Before is the commit before the rule (`047d2f23`).

| City | | Citizens | Jobs | Jobs filled | Unemployed | Walking | Cycling | Public transport | Car | Congestion index | Emissions | Empty workplaces | ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Robbart (r354) | before | 1000 | 951 | 300 | 0 | 260 | 40 | 700 | 0 | 0 | 0 | 12 of 19 | 1 |
| | after | 1000 | 951 | 951 | 49 | 741 | 210 | 0 | 0 | 0 | 0 | 0 of 19 | 24 |
| Maenia (r1502) | before | 3222 | 4120 | 1593 | 0 | 1427 | 166 | 1629 | 0 | 0 | 1.5 | 26 of 47 | 71 |
| | after | 3222 | 4310 | 3222 | 0 | 2113 | 1079 | 30 | 0 | 0 | 1.5 | 12 of 47 | 59 |
| TheQueen (r1305) | before | 7163 | 7336 | 6352 | 145 | 1221 | 2782 | 1469 | 148 | 0.011 | 14.8 | 10 of 93 | 191 |
| | after | 7163 | 7359 | 6163 | 0 | 3364 | 1895 | 903 | 1 | 0 | 0.1 | 11 of 93 | 286 |

- **Homes with no Road and the Unemployed count.** Without the exemption, TheQueen showed 1,000 Unemployed (13 Homes reached only by BRT or Pedestrian ways, 604 and 396 Citizens) while Jobs outnumbered Citizens. The exemption brings it back to 0; ADR 0059 records it.
- **Robbart and Maenia are compact**: every Job is within the cycling range, so public transport carries almost nobody (0 and 30) and Maenia's nine lines sit idle. TheQueen is large enough for trips beyond that range, and its sixteen lines keep 903 Riders.
- **Maenia sensitivity** (cycling factor / walking threshold): x3/10 gives 30 Riders and 0 cars; x2/10, 140 Riders and 193 cars; x3/6, 360 Riders and 71 cars. Narrowing the range brings the lines back and also brings cars, saturated sections and emissions back.
- **TheQueen** takes 286 ms, 1.5 times the old 191 ms; the result is cached while the layout stays the same.

### Applied: cycling range to a Job of 20 tiles (`WALKING.workCyclingFactor` = 2)

The cycling factor of 3 stays for trips to Services and for the way to a station. Only the way to a Job narrows, from 30 to 20 tiles at the usual walking threshold of 10. Measured with the final value; Before is the commit before ADR 0059, Current the rule with a range of 30 tiles.

| City | | Jobs filled / offered | Unemployed | Walking | Cycling | Public transport | Car | Congestion | Saturated sections | Emissions | Temperature (°C) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Robbart (1,000) | Before | 300 / 951 | 0 | 260 | 40 | 700 | 0 | 0 | 0 | 0 | 26.14 |
| | Current | 951 / 951 | 49 | 741 | 210 | 0 | 0 | 0 | 0 | 0 | 26.14 |
| | **Applied** | 951 / 951 | 49 | 741 | 210 | 0 | 0 | 0 | 0 | 0 | 26.14 |
| Maenia (3,222) | Before | 1,593 / 4,120 | 0 | 1,427 | 166 | 1,629 | 0 | 0 | 3 | 1.5 | 26.83 |
| | Current | 3,222 / 4,310 | 0 | 2,113 | 1,079 | 30 | 0 | 0 | 3 | 1.5 | 26.83 |
| | **Applied** | 3,222 / 4,310 | 0 | 2,113 | 776 | **262** | 71 | 0.05 | 5 | 8.6 | 26.91 |
| TheQueen (7,163) | Before | 6,352 / 7,336 | 145 | 1,221 | 2,782 | 1,469 | 148 | 0.011 | 0 | 14.8 | 27.58 |
| | Current | 6,163 / 7,359 | 0 | 3,364 | 1,895 | 903 | 1 | 0 | 0 | 0.1 | 27.39 |
| | **Applied** | 5,932 / 7,359 | 0 | 3,364 | 1,291 | **1,261** | 16 | 0 | 0 | 1.6 | 27.41 |
| `idealCity` (2,000, no line) | Before | n/m / 2,383 | 0 | 1,070 | 733 | 0 | 197 | 0.15 | 0 | 19.7 | 26.23 |
| | Current | 2,000 / 2,383 | 0 | 1,526 | 440 | 0 | 34 | 0.02 | 0 | 3.4 | 26.06 |
| | **Applied** | 2,000 / 2,383 | 0 | 1,526 | 308 | 0 | 166 | 0.16 | 0 | 16.6 | 26.20 |
| `evolvedCity` (1,752, no line) | Before | n/m / 1,567 | 185 | 80 | 308 | 0 | 1,179 | 1.79 | 53 | 117.9 | 40.00 |
| | Current | 1,567 / 1,567 | 185 | 198 | 687 | 0 | 682 | 1.09 | 22 | 68.2 | 39.62 |
| | **Applied** | 1,567 / 1,567 | 185 | 198 | 567 | 0 | 802 | 1.11 | 22 | 80.2 | 40.00 |

Why this value and not another, from the experiments:

- **Narrowing the range everywhere** (jobs, services and the way to a station) gave Maenia 242 Riders and 91 cars; narrowing it only for Jobs gives 262 Riders and 71 cars, because a Citizen still cycles to a station from 18 tiles.
- **A car access time** (2, 3 or 5 minutes) removed only 14 to 54 of Maenia's 91 drivers: the others have no line within reach or find it full. Not adopted.
- **Narrower still** (16 tiles) gives Maenia 553 Riders but TheQueen 147 cars; 12 tiles, 191 and 159 cars. Not adopted.
- **The cost**: in a city with no public transport line, the Citizens who lose the Job within 30 tiles by bicycle drive (`idealCity` 34 to 166 cars, `evolvedCity` 682 to 802, which reaches the 40 °C ceiling). The value serves the cities that have lines and penalises those that have none.

