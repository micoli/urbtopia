# Congestion Diagnosis

Status: ready-for-agent

## Problem

The Traffic section of the City management window gives figures (Congestion index, saturated road tiles, mode mix) and a button to the worst bottleneck, but never says *why* the roads jam. A player sees "181 saturated tiles" and has to guess whether to widen a road, move a workplace or build a Bus line.

A good explanation can be derived from data the game already computes (`congestionStats`, `transportStats`, the Road tiers, the crossings). No LLM is needed: a pure function turns those figures into a short ranked list of Causes, each rendered through the existing i18n catalog.

## Decisions

- **Diagnosis**: a ranked list of at most three **Causes** explaining the current Congestion, each with a weight, its figures and an optional place on the map. New vocabulary, to be added to `CONTEXT.md` (see issue 04). Not a Sanction, not a Petition, not a Need.
- Pure and deterministic: `diagnoseCongestion(state, congestion, transport): Diagnosis` in `src/core/traffic/diagnosis.ts`. No randomness, no clock, no I/O; `src/core` knows nothing of the UI.
- The shared shape (`Diagnosis`, `Cause`) and the shared panel live outside the traffic folder so the Waste Diagnosis ([waste-diagnosis](../waste-diagnosis/spec.md)) reuses them. Issue 01 delivers them first.
- A Cause is a translation key plus numeric parameters, never a sentence built in code. Texts go in `src/i18n/catalog.ts` in English and French, as for every other label.
- Weight is the share of the city's Citizens whose Commute the Cause hurts (0 to 1). Causes are sorted by weight, those under a minimum weight are dropped, and nothing is shown when Congestion is low.
- Computed from the same cached stats as the Traffic section, with no second Commute calculation. Extra aggregation (corridors, barycentres) is linear in the number of road tiles and Homes.
- Each Cause that has a place carries tiles to focus; the panel offers a "Show on map" button using the existing `showTile` like `BottleneckButton`.
- The Diagnosis is shown in the Traffic section of the City management window, under the figures. No new window, no notification.

## Causes

Thresholds are starting values, kept in the `CONGESTION_DIAGNOSIS` constant next to the rules (like `CONGESTION` in `roadTier.ts`) and covered by tests, to be tuned on real saves. `emptyJobsFarAway` was dropped: unfilled Jobs far from the Homes do not load the roads.

| Cause | Detected when | Figures | Place |
|---|---|---|---|
| `untouchedTiers` | at least N saturated sections, and most of them are still Tier 1 | saturated Tier 1 sections / saturated sections | the worst Tier 1 section |
| `corridor` | a run of contiguous saturated sections with nearly equal load carries at least a given share of the car Commuters | length, load, capacity, ends of the run | the run |
| `crossingsChoke` | saturated or heavy Crossings sit on saturated sections whose capacity is cut by pedestrians | number of Crossings, capacity lost | the worst Crossing |
| `homesFarFromJobs` | the Citizen-weighted barycentre of Homes and the Job-weighted barycentre of workplaces are far apart relative to the city size | distance in tiles, bearing | both barycentres |
| `carHeavy` | the car share of trips is high and the modal shift is close to zero, while public transport lines exist | car share, shifted Riders | none |
| `noTransit` | same, and the city has no public transport line yet | car share | none |
| `disconnected` | `disconnectedSections` is not empty | number of Homes cut off | the first section |

Open question for triage: do we want a `bridgeOpenings` Cause (capacity lost to open Bridges)?

## Out of scope

Automatic fixes, cost estimates for each remedy, a "simulate this change" preview, changes to the Congestion model itself, notifications when a Cause appears, Petitions and Ordinances reading the Diagnosis.

## Issues

1. [Shared Diagnosis shape and panel](issues/01-shared-diagnosis-shape-and-panel.md)
2. [Congestion Causes](issues/02-congestion-causes.md) (after 01)
3. [Diagnosis in the Traffic section](issues/03-traffic-section-diagnosis.md) (after 01, 02)
4. [Vocabulary, Guide article and docs](issues/04-guide-and-docs.md) (after 03)
