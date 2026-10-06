# Pedestrian network balancing

Status: Provisional values, tunable without changing the rules. Source of truth in code: `src/core/traffic/walking.ts` (`WALKING`).

## Values

| Quantity | Value |
| --- | --- |
| Walking cost | 1 per sidewalk step, +2 per Crossing crossed |
| Threshold to a workplace | 10 |
| Threshold to a destination | shop 12, school / health / culture / casino 15, park 20 |
| Walking trips per Citizen | shop 1, school 0.6, culture 0.3, health 0.2, casino 0.2, park 0.5 |
| Destinations | shop; school, middle school, high school, university; hospital; theatre, concert hall, community hall; casino; any non-habitat vegetation |
| Well-being bonus | up to 8 points, rounded to whole points, proportional to the share of the weighted destination kinds reachable on foot; never above the 100 limit |
| Crossing capacity cut | 1.5% of the road capacity per pedestrian, capped at 60% (reached at 40 pedestrians) |
| Saturated Crossing | cut at its cap |
| Figures in the scene | one per 8 walking people, at most 1 per 3 sidewalk nodes, 100 (50 on touch) |

The Well-being bonus is whole points because the catch-up property tests require exact equality between replaying a gap in one call and in steps; a fractional bonus changes the Tax rounding.

## Measurements

Headless autoplayer city (seed `amber-fox-4821`), walking off then on:

| Citizens | Index off / on | Car Commuters off / on | Walking Commuters | Walking trips (school / health) | Well-being off / on |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 158 | 0.44 / 0.44 | 158 / 158 | 0 | 77 / 0 | 10.0 / 11.6 |
| 420 | 1.18 / 1.18 | 420 / 420 | 0 | 144 / 0 | 1.3 / 2.4 |
| 1100 | 2.00 / 2.00 | 1100 / 1100 | 0 | 384 / 96 | 9.4 / 10.6 |
| 2410 | 1.24 / 1.24 | 1473 / 1473 | 0 | 600 / 150 | 18.8 / 19.7 |

The autoplayer builds long straight roads with workplaces beyond 10 steps and never places a Crossing, so no one walks to work and Congestion is unchanged: an existing city loads without a Congestion spike, and the only change is a Well-being gain of 1 to 1.6 points. No Adaptation period is needed because walking never adds car load.

Hand-built street (shop on one side, Homes on the other, a single Crossing in front of the shop):

| Homes | Crossing | Walking Commuters | Pedestrians on the Crossing | Capacity cut |
| --- | --- | ---: | ---: | ---: |
| 2 small | no | 12 | 0 | 0 |
| 2 small | yes | 12 | 12 | 18% |
| 2 medium | yes | 50 | 96 | 60% (cap) |
| 3 medium | yes | 50 | 128 | 60% (cap) |

## Known limits and follow-ups

- A Crossing saturates quickly: one medium Home is enough to reach the 60% cap. If playtests find it too punishing, lower `crossingCutPerPedestrian` or raise `maxCrossingCut` thresholds before touching the rules.
- Walking Commuters take the nearest jobs first like drivers, so a city with workplaces next to Homes sees most of its Commute leave the road; the car load only matters for far workplaces.
- Crossings are placed by hand only; the autoplayer does not place them, so the trade-off is covered by `crossingCapacity.test.ts` on hand-built streets.
- Destination capacity is not limited: a single shop absorbs every walking trip in range.
