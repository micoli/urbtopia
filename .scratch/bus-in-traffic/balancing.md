# Buses in traffic balancing

Status: Provisional values, tunable without changing the rules. Source of truth in code: `src/core/traffic/busTraffic.ts` (`BUS_TRAFFIC`), `src/scene/trafficSpawn.ts` (`SPAWN`), `src/scene/trafficOptions.ts`.

## Values

| Quantity | Value |
| --- | --- |
| Load of an active Bus line on each tile of its route | 20 car equivalents, constant |
| Effective speed | nominal speed × route length ÷ Σ (1 + excess), with excess = ratio − 1 above 1 (ratio clamped to 2) |
| Speed floor | 50% of the nominal speed (follows from the maximum ratio) |
| Effective capacity | 120 × effective ÷ nominal speed |
| "Slowed by traffic" mention | below 90% of the nominal speed |
| Car spawn weight on a tile | 1 up to ratio 1, rising to 5 at ratio 2 |
| Scene bus speed | 1.5 tiles per second, one bus per active Bus line |
| Emergency vehicles | priority kept; `SERVICE_VEHICLES_FOLLOW_TRAFFIC` off |

## Measurements

Hand-built street (tier 1 road, workplaces at both ends, tier 7 Homes, walking off), lines sharing the same stops. Effective speed factor of a line, Riders after the slowdown against Riders at nominal speed, and Congestion index, with and without the bus load:

| Homes | Lines | Speed factor (no load / load) | Riders (nominal / slowed, with load) | Index (no load / load) |
| ---: | ---: | ---: | ---: | ---: |
| 2 | 0 | 1 / 1 | 0 / 0 | 2.00 / 2.00 |
| 2 | 1 | 0.65 / 0.60 | 120 / 72 | 1.86 / 1.89 |
| 2 | 2 | 1 / 1 | 240 / 240 | 1.00 / 1.00 |
| 2 | 8 | 1 / 0.62 | 350 / 350 | 0.75 / 0.75 |
| 3 | 1 | 0.60 / 0.60 | 120 / 72 | 1.26 / 1.26 |
| 3 | 4 | 1 / 0.75 | 480 / 360 | 1.08 / 1.33 |
| 3 | 8 | 1 / 0.57 | 525 / 543 | 1.08 / 1.22 |

- On a jammed street a lone line runs at 60% of its speed and carries 40% fewer Riders, so a bus is worth less exactly where the road needs it.
- Stacking many lines on one tier 1 street is self-defeating: 8 lines push the street over capacity on their own (factor 0.62 with an index of 0.75). Parallel lines or Road tier upgrades are the answer; BRT avoids it altogether.
- Modal shift is damped: with 3 Homes and 6 lines the shift falls from 19 to 2 Riders because the slowed lines have little spare capacity.

The headless autoplayer city builds no Bus line, so existing and autoplayer cities are unchanged: no Congestion spike, no Adaptation period needed. A saved city with Bus lines can see a higher Congestion index (3 Homes, 4 lines: 1.08 to 1.33); revisit the load or add an Adaptation period if that proves too harsh.

## Known limits and follow-ups

- One bus per line is drawn whatever the load; the number of buses does not follow the Headway.
- The bus load is the same for every line regardless of its length or Headway.
- Cars and buses share the car-following engine, so a slow bus holds the cars behind it on the same Lane; this is intended.
- No dwell at bus stops and no bus Lane on tier 2 or 3 roads.
