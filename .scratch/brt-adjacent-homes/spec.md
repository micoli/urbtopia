# Buildings next to a BRT corridor

Status: ready-for-agent

Follow-up to [dedicated-transit](../dedicated-transit/spec.md), [traffic-congestion](../traffic-congestion/spec.md), [pedestrian-network](../pedestrian-network/spec.md) and [bus-in-traffic](../bus-in-traffic/spec.md). Vocabulary (**Home**, **BRT corridor**, **BRT station**, **Access mode**, **Rider**, **Commute**, **Pedestrian path**, **Service vehicle**) is in `CONTEXT.md`. Respects [ADR 0006](../../docs/adr/0006-independent-transit-networks-and-purchased-fleets.md) (networks stay independent) and [ADR 0017](../../docs/adr/0017-building-access-modes.md) (access modes).

## Problem Statement

Every Home must have a Road tile in front of it (`requiresRoad`, `frontTouchesRoad` in `src/core/map/placement.ts`). A player who builds a BRT corridor cannot densify around it without also laying a road beside it, which defeats the purpose of a dedicated transit axis and forces a car-oriented layout everywhere.

## Solution

Homes, Leisure buildings, Shops and Public facilities accept the BRT corridor as an Access mode, as an alternative to the Road. A building declares the modes it accepts in `assets/buildings.json`. A building reached only by BRT has no car Commute and no Pedestrian path: it lives off public transport, served by the BRT stations that cover it. Players see which buildings are BRT compatible in the build menu, on the placement ghost, in the building panel and in the assets editor.

## User Stories

1. As a player, I want to place a Home next to a BRT corridor without a road, so that I can build a transit-oriented district.
2. As a player, I want a Home touching both a road and a BRT corridor to keep working on the road, so that mixed streets stay valid.
3. As a player, I want the Home front to face the road first when both exist, so that existing layouts do not change.
4. As a player, I want Leisure buildings, Shops and Public facilities to follow the same rule, so that a BRT district can be self-sufficient.
5. As a player, I want Workshops, Factories and other economic buildings to still need a road, so that Goods flows are unchanged.
6. As a player, I want a badge on compatible buildings in the build menu, so that I know before choosing.
7. As a player, I want the placement ghost to show when the BRT is what validates the position, so that the rule is readable.
8. As a player, I want the placement error to say "road or BRT" when it applies, so that I understand the refusal.
9. As a player, I want the building panel to state its access (road, BRT or both), so that I can diagnose a district.
10. As a player, I want a BRT-only Home to have no car Commute, so that the model stays honest about access.
11. As a player, I want a BRT-only Home to be served by the BRT stations that cover it, so that building a station matters.
12. As a player, I want a BRT-only Home with no station in reach to be marked disconnected (red cross, maximum Congestion), so that I know to add a station.
13. As a player, I want a BRT-only Shop, Leisure building or Public facility to offer Jobs only to Riders of covered Homes, so that transit keeps the district alive.
14. As a player, I want a BRT-only Shop to sell to Citizens covered by a station, so that it earns Urbs.
15. As a player, I want a BRT-only Public facility to keep its radius coverage, so that services reach the district.
16. As a player, I want removal of the last access of a building (road or BRT) to be refused, so that I never strand buildings by accident.
17. As a player, I want a building touching both a road and a BRT to be removable from either, as long as one remains.
18. As a player, I want ambulances, fire trucks and police cars to drive on the BRT from a BRT-connected facility, so that the district looks alive.
19. As a player, I want a Service vehicle to stay on the network of its facility, so that road and BRT remain independent.
20. As a player, I want Service vehicles to ignore BRT vehicles visually on the corridor, so that nothing blocks and the rendering stays cheap.
21. As a map designer, I want a checkbox in the assets editor for the access modes of a building, so that I can set it without editing JSON.
22. As a returning player, I want my saved city to load unchanged, so that the update costs nothing.

## Implementation Decisions

- **Data.** `assets/buildings.json` gains `accessModes: ('road' | 'brt')[]` on each entry, next to `requiresRoad` (`src/core/buildings/buildingDefinition.ts`, `buildingSpecs.ts`). Home, Leisure, Shop and Public facility entries get `['road', 'brt']`. The type admits only `'road'` and `'brt'`; rail is out of scope but the shape leaves room. An entry without `accessModes` behaves as `['road']` when `requiresRoad` is true and as no access requirement otherwise. Stations keep their own rule.
- **Placement.** `frontTouchesRoad` becomes a general front-access check per mode in `src/core/map/placement.ts`. A position is valid if any accepted mode has a tile in front: Road (`isRoadLike`) or BRT corridor tile (`state.brtRoads`). `defaultRotation` prefers a road front, then a BRT front. The error `error.needsRoad` is worded "road or BRT" for buildings that accept both.
- **Demolition.** `demolishRoad` in `src/core/engine/commands.ts` and the BRT removal command refuse to remove the last access of a building, whichever mode, with `error.lastRoadOfBuilding` generalized to a last-access error. A building touching both modes is only orphaned when both are gone.
- **Commute and walking.** A BRT-only building has empty `access` for roads (`congestion.ts`) and no sidewalk nodes (`pedestrianGraph.ts` `accessNodes`), hence no car Commute and no Pedestrian path. No change to road-served buildings.
- **Riders and Jobs.** A BRT-only workplace (Shop, Leisure building, Public facility) offers its Jobs only to Riders of Homes covered by a station. A BRT-only Shop sells to Citizens covered by a station. Public facilities keep their radius coverage.
- **Connectivity marker.** A BRT-only Home with no BRT station covering it is flagged disconnected like a disconnected road section: red cross, maximum Congestion. Placement is still allowed.
- **Service vehicles.** `serviceTrip.ts` plans trips on the network that connects the facility to its covered Homes: the road graph for road fronts, the BRT network (`state.brtRoads` tiles and exits) for BRT fronts. A facility touching both can use either. No switching between networks. A Home covered but unreachable on the facility's network gets no vehicle. Vehicles ignore BRT vehicles visually.
- **UI.** The build menu card shows a "BRT compatible" badge. The ghost front marker changes when the BRT validates the position. The building panel shows the access (road, BRT or both). `tools/assets-editor` exposes the field. All strings in `src/i18n/messages.ts` and `fr.ts`.
- **Saves.** No change to the saved state shape: `accessModes` lives in data only, so no migration of the localStorage envelope (ADR 0003) and no change to the cloud save. Existing cities stay valid.
- **Tutorial.** No new step.
- **Suggested slicing** (one issue each, in order): (1) data and placement and rotation; (2) demolition guards; (3) Commute, walking and connectivity marker; (4) Riders, Jobs and Shop sales for BRT-only buildings; (5) Service vehicles on the BRT network; (6) UI badge, ghost, panel, assets editor, i18n; (7) balancing and tests across the seams.

## Testing Decisions

- **Seam 1 (core placement):** valid on road only, BRT only, both and neither; rotation prefers road; non-compatible types still refused with `error.needsRoad`; rail tiles never validate. Prior art: `placement.test.ts`.
- **Seam 2 (core demolition):** removing the last road or the last BRT tile of a building is refused; removing one of two is allowed. Prior art: `roads.test.ts`.
- **Seam 3 (core traffic):** BRT-only Home has no car Commute and no Pedestrian path; disconnected marker with no covering station and not with one; Jobs of BRT-only workplaces filled by Riders only; Shop sales to covered Citizens; determinism across calls and catch-up. Prior art: `congestion.test.ts`, `modalShift.test.ts`, `walkingCommute.test.ts`.
- **Seam 4 (scene):** service trip planned on the BRT network from a BRT-connected facility; no trip when the Home is on the other network. Prior art: `TransitLayer.test.ts` and the service trip tests.
- **Seam 5 (interface):** badge in the build menu, access line in the building panel, FR/EN strings, no `undefined`. Prior art: existing build menu and panel render tests.
- Rendering of the ghost front and of Service vehicles on the BRT is checked by eye in the dev server.

## Out of Scope

- Railway and rail stations as an Access mode (the field is ready for it).
- Workshops, Factories, storages, farming and every economic building outside the four categories.
- Sidewalks or crossings along the BRT corridor.
- New Congestion model for the BRT, new BRT capacity or new lines.
- Avoidance rules between Service vehicles and BRT vehicles.
- A new tutorial step.
- Any change to the save format.

## Further Notes

- The main risk is balance: without a road, a BRT district runs entirely on Riders, so BRT capacity, station coverage and Jobs in covered buildings decide whether it thrives. Measure with the headless autoplayer in the balancing issue.
- The disconnected marker for a BRT-only Home reuses the road marker so no new UI is invented; revisit if the wording is confusing.
- Source: grilling session. Settled by the user: Shops, Leisure buildings and Public facilities join Homes, with a visible compatibility indicator; Service vehicles may drive on the BRT. Every other design choice was proposed and approved in the session.
