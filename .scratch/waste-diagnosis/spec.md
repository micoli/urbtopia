# Waste Diagnosis

Status: resolved

## Problem

The Waste section of the City management window already lists, per cause, how many Homes lack Waste coverage (out of reach, capacity full, no road link, beyond Carrying distance, facility stopped) and shows the balance between production and processing. It says *what* is wrong for each Home, not *why the city as a whole* is in that state, nor what to build first. A player with 40 uncovered Homes does not know whether they need more capacity, a road to the facilities, a power plant for the Recycling plant, or just more Urbs.

Like the [Congestion Diagnosis](../congestion-diagnosis/spec.md), this can be derived from figures the game already computes (`wasteReport`, `wasteSituation`). No LLM is needed.

## Decisions

- Same model as the Congestion Diagnosis: a ranked list of at most three Causes, a translation key plus parameters, weight = share of Citizens concerned, rendered by the shared `DiagnosisPanel`. The shared shape comes from [congestion-diagnosis issue 01](../congestion-diagnosis/issues/01-shared-diagnosis-shape-and-panel.md); this spec starts after it.
- Pure and deterministic: `diagnoseWaste(state): Diagnosis` in `src/core/waste/diagnosis.ts`, built on `wasteSituation` and `wasteReport`; no second pass over the Homes.
- Nothing is shown below the Citizens threshold where Waste matters (`WASTE_REQUIRED_FROM_CITIZENS`) or during the Adaptation period, and nothing when every Home is covered and nuisances are low.
- Vocabulary follows `CONTEXT.md`: Waste, Waste coverage, Carrying distance, Mound, Incinerator, Recycling plant, Odor radius. Never "garbage", "trash" or "rubbish", in code, docs or texts.
- Facilities are used from the cleanest to the dirtiest, so the advice respects that order: a text that suggests "more Mounds" says what it costs in Odor.
- "Show on map" focuses the facility or Home the Cause is about, with the same `showTile`.
- Shown in the Waste section of the City management window, under the balance.

## Causes

| Cause | Detected when | Figures | Place |
|---|---|---|---|
| `noFacility` | the city has no Waste facility at all (the only Cause shown then) | produced per day | none |
| `capacityShort` | processing capacity is below production and the main uncovered cause is `capacityFull` | produced, capacity, missing per day | none |
| `stopped.noUrbs` / `stopped.noRoad` / `stopped.noPower` | at least one facility is stopped for that reason (the dominant one is named); weight counts the uncovered Homes in reach of a stopped facility | which of the three, how many facilities, Citizens left uncovered | the first stopped facility |
| `noRoadLink` | Homes are uncovered by `noRoadLink` | Homes, Citizens | the largest such Home |
| `farFromFacilities` | Homes are uncovered by `outOfReach` or `beyondCarryingDistance` | Homes, Citizens, distance to the nearest facility | the largest such Home |
| `carriedSurcharge` | Homes reached only by Pedestrian ways make the pedestrian surcharge a large share of the cost | Homes, extra cost | the first such Home |
| `odor` / `incinerator` | Homes bear an Odor or Incinerator malus | Homes concerned | the largest such Home |

`costsTooMuch` (no daily income figure to compare with; a lack of Urbs is already named by `stopped.noUrbs`) and `noSorting` (it points at an Ordinance, which the Politics system owns) were dropped. The capacity text mentions sorting without detecting it.

## Out of scope

Automatic placement of facilities, cost estimates for each remedy, changes to the Waste model, a map overlay of uncovered Homes, notifications.

## Issues

1. [Waste Causes](issues/01-waste-causes.md) (after congestion-diagnosis 01)
2. [Diagnosis in the Waste section](issues/02-waste-section-diagnosis.md) (after 01)
3. [Guide article and docs](issues/03-guide-and-docs.md) (after 02)
