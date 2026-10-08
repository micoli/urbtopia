# Buildings next to a BRT corridor balancing

Status: Measurements only, no value tuned. Nothing changes the existing rules; source of truth in code: `src/core/traffic/congestion.ts` (`brtOnlyEntry`, `brtOnlyJobs`), `src/core/transit/transport.ts` (`coveredActivities`), `src/core/engine/advance.ts` (`idleShopIds`).

## Rules recap

| Quantity | Value |
| --- | --- |
| BRT-only Home covered by a station | Congestion ratio 0, no Commute, no Pedestrian path; Riders up to 70% of its Citizens |
| BRT-only Home with no station in reach | Disconnected: ratio 2 (the 25-point Well-being cap), red cross on its footprint |
| Jobs of a BRT-only workplace | Counted in the city Jobs only while an active line has a stop within 6 tiles; never filled by car |
| BRT-only Shop with no station in reach | Sales paused, stock kept; they resume on coverage |
| BRT-only facility or casino as a Rider destination | Yes, within 6 tiles of a stop of an active line |

## Measurements

Hand-built district (BRT corridor of 21 tiles, 2 stations, 1 electric BRT vehicle, off-peak Headway 12, a hospital near the second station, Homes along the corridor). The "road" rows are the same layout with a Road instead of the BRT corridor and a workshop at the end.

| Home Tier | Homes | Citizens | Mode | Riders | Line capacity | Commuters by car | Congestion index |
| ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| 3 | 3 | 96 | BRT | 67.2 | 157 | 0 | 0 |
| 3 | 3 | 96 | road | 0 | 0 | 45 | 0.30 |
| 5 | 3 | 300 | BRT | 156.5 | 157 | 0 | 0 |
| 5 | 3 | 300 | road | 0 | 0 | 45 | 0.15 |
| 6 | 3 | 480 | BRT | 156.5 | 157 | 0 | 0 |
| 6 | 3 | 480 | road | 0 | 0 | 45 | 0.15 |

Well-being is identical between the BRT and road rows at the same Tier (-10, -20, -40 here, from missing services only).

Autoplayer (seed `amber-fox-4821`, no BRT built), `main` against this branch: identical down to the last digit (4863 turns, 2656 Citizens, Congestion index 1.2425, 1463 Commuters, 2369 Jobs, 1183 without a Job, 35 saturated sections, 2 disconnected, Tax 45). Existing and autoplayer cities are unchanged, and the versioned save envelope is untouched (`saves/evolved-city.json` still matches its generator).

## Findings and proposals

- A covered BRT-only district has a Congestion index of 0 whatever its size. The 480-Citizen district above rides at the line capacity (156.5 of 157) with 220 Citizens who wanted to ride and cannot, and nothing in the model charges that. A BRT district is therefore strictly cheaper than a road district once a station covers it. The rules say a BRT-only Home depends on its stations; the model does not yet make saturation hurt.
- Proposal A (preferred): give a covered BRT-only Home a ratio from its unserved Riders, `1 + unserved ÷ eligible` clamped to the maximum ratio, so a saturated line costs Well-being like a saturated road.
- Proposal B: cap the Riders share of a BRT-only Home at 70% and count the rest as unemployed, which shows up in the Jobs statistics only.
- Proposal C: leave it, and rely on the vehicle price and running cost (4 Urbs per hour for the vehicle) as the only brake.
- The Jobs of BRT-only workplaces are counted but not consumed by Riders. Riders already ignore Jobs for road workplaces, so this matches, but the "Commuters without a job" figure does not include BRT-only unemployment.

## Known limits

- The ghost front marker and Service vehicles on the BRT corridor were not checked by eye in a browser.
- Station coverage is a Manhattan distance of 6 tiles, so a BRT-only district is bounded to the neighbourhood of its stations.
- A building touching both a Road and a BRT corridor is treated as road-served: it has no BRT-only behaviour.
