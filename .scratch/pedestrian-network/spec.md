# Pedestrian network and walking mode

Status: resolved

Follow-up to [traffic-congestion](../traffic-congestion/spec.md) and [traffic-congestion-followups](../traffic-congestion-followups/spec.md). Vocabulary (**Commute**, **Commuter**, **Lane**, **Road tier**, **Congestion**, **Rider**, **Modal shift**) is in `CONTEXT.md`. Respects [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md): walking stays an aggregate core model, no individual Citizen journeys; visible pedestrians are a cosmetic projection.

## Problem Statement

Congestion only knows two ways to move: car and public transport. Crossings (`RoadKind = 'crossing'`) exist but have no effect: no one uses them and they do not slow traffic. Citizens never walk, even to a workplace next door, and the only demand is Home to workplace. Players cannot trade road capacity for walkability, and City Management cannot show the real mix of car, public transport and walking.

## Solution

Walking becomes a third mode. Sidewalks are implicit on every road tile, with two distinct sides. A road can only be crossed at a Crossing or at a dead end. Citizens walk to a workplace when a pedestrian path under a distance threshold exists, which removes them from the road load. Homes also generate walking trips to shops, schools, health, culture, casino and parks: these add no car demand, give Well-being, and load the Crossings they use. Heavily used Crossings reduce the capacity of their road tile, so the player trades road throughput for walkability. City Management shows the car / public transport / walking mix. Stick-figure pedestrians are drawn as a cosmetic layer.

## User Stories

1. As a player, I want Citizens to walk to workplaces within walking distance, so that nearby jobs do not load the roads.
2. As a player, I want Crossings to be the only way to cross a road, so that placing them matters.
3. As a player, I want dead ends to be walkable around, so that a cul-de-sac does not cut a neighbourhood in two.
4. As a player, I want sidewalks without building anything, so that walking works from the start.
5. As a player, I want Homes to walk to shops, schools, health, culture, casino and parks, so that a well-served neighbourhood is rewarded.
6. As a player, I want walking trips to add no car demand, so that existing traffic is not inflated.
7. As a player, I want walking to services to improve Well-being, so that walkability has a visible benefit.
8. As a player, I want a Crossing to lose road capacity when many pedestrians use it, so that I see its cost.
9. As a player, I want an unused Crossing to cost no capacity, so that placing one is never a trap.
10. As a player, I want each Crossing crossed to add walking time, so that a path with many Crossings is less attractive.
11. As a player, I want a missing Crossing to make a destination unreachable on foot, so that I understand why people drive.
12. As a player, I want the walking Commuters to be counted apart from car Commuters, so that Congestion reflects only cars.
13. As a player, I want the mix of car, public transport and walking shown in City Management, so that I see how my city moves.
14. As a player, I want the walking share, walking trips to services and saturated Crossings in the Traffic section, so that I can act on them.
15. As a player, I want saturated Crossings tinted like congested sections, so that I find them on the map.
16. As a player, I want the overview tile to show the walking share, so that I read the mix at a glance.
17. As a player, I want the Modal shift and the walking share to be consistent, so that a Rider is never also a walker.
18. As a player, I want stick-figure pedestrians walking and crossing on the map, so that the city feels alive.
19. As a player, I want cars to visibly stop at a Crossing when a pedestrian crosses, so that the scene matches the model.
20. As a player, I want pedestrians never saved, so that loading a city is unchanged.
21. As a player, I want the same city to give the same walking results on every reload and catch-up, so that nothing changes between sessions.
22. As a player, I want my existing city to load without surprise, so that new walking rules do not unfairly raise Congestion.
23. As a player, I want no individual Citizen tracked, so that the simulation stays understandable and light.
24. As a maintainer, I want walking distances, destination weights and Crossing parameters in the balancing document, so that they can be tuned without changing rules.
25. As a maintainer, I want walking to build on the existing congestion statistics and `layoutSignature` cache, so that no second traffic model appears.
26. As a player, I want FR/EN labels for every new element, so that it matches the rest of the UI.

## Implementation Decisions

- **Pedestrian graph.** Built from the road layout, pure and deterministic. Each road tile has two sides. Sides connect along the road, around corners of Intersections on the same side, and around Roundabout rings on the outside. The two sides of a tile connect only at a Crossing tile (straight tile, existing rule) or at a dead end. Nothing else is crossable. A Building is attached to the side of the road tile in front of it (`frontTiles`).
- **Walking cost.** Path length in tiles over the pedestrian graph, plus 2 per Crossing crossed.
- **Distance thresholds** (in `GAME_CONFIG`): workplace 10, shop 12, school / health / culture 15, park 20.
- **Commute walking.** Job assignment stays as in `jobs.ts` (nearest first, stable order). For each assignment, if a pedestrian path under the work threshold exists, those Commuters walk and add no car load; otherwise they drive as before. Riders from Modal shift only come from car Commuters, so a Rider is never also a walker.
- **Walking trips to services.** Each Home generates trips by type with a per-type weight (shop > school / health / culture / casino > park), to the nearest destination reachable on foot under its threshold, with no destination capacity. They add no car demand. They give a Well-being benefit and load the Crossings on their path.
- **Crossing capacity.** On a Crossing tile, `effectiveCapacity = capacity × (1 - min(0.6, k × pedestrians))`. Bottleneck and ratio computed as today with `effectiveCapacity`. An unused Crossing has no effect.
- **Statistics.** Congestion statistics gain: walking Commuters, walking service trips by type, mode shares (car, public transport, walking), saturated Crossings, plus the effective capacity used per Crossing. Existing fields keep their meaning.
- **Cache and save.** Everything derived. `layoutSignature` is extended to Crossings and destinations. No new persisted field and no save version change. If a city loads with new walking effects that raise Congestion, the existing Adaptation period applies.
- **Scene.** Stick-figure pedestrians as a cosmetic layer, same rules as vehicles (ADR 0011): never saved, no effect on the core, bounded count (about 100). Cars stop visually when a pedestrian crosses. Real character asset later.
- **ADR 0011 amendment** records walking as a third aggregate mode and pedestrians as a cosmetic projection. Glossary adds **Pedestrian path**, **Walking trip**, **Sidewalk side**; **Commute** is updated.
- **City Management.** Traffic section shows the three-way mix, walking trips by service type and saturated Crossings. Overview tile shows the walking share. A saturated Crossing is tinted on the map. FR/EN strings, one React component per file.

## Testing Decisions

- A good test checks external behaviour: given a city, what the congestion statistics, mode shares, Well-being and what the user sees are. It never checks the order of internal loops.
- **Seam 1 (core):** the pedestrian graph and the congestion statistics. Cover: sides never joined except at a Crossing or dead end; corners join same sides; roundabout outer walk without crossing; thresholds and Crossing cost; walking Commuters adding no car load; no walker also a Rider; services trips adding no car load and giving Well-being; Crossing capacity cut and cap; unused Crossing no effect; determinism across calls and catch-up; mode shares summing to 100%. Prior art: existing congestion and congestion Well-being tests.
- **Seam 2 (interface):** the City Management render test for the three-way mix, the walking trips and saturated Crossings, FR/EN labels and no `NaN` or `undefined`. Prior art: `CityManagement.test.tsx`.
- Rendering of pedestrians and Crossing tint is checked by eye in the dev server, as for the other traffic work.

## Out of Scope

- Individual Citizen journeys.
- New car demand for non-work trips.
- Dedicated pedestrian ways, pedestrian-only streets, benches or street furniture.
- Capacity-limited walking destinations.
- Final pedestrian art assets (stick figures for now).
- Automatic Crossing placement.
- Bicycles or other modes.

## Further Notes

- All numbers (thresholds, weights, `k`, cap, Well-being benefit, pedestrian count) are the author's starting values, to be set from headless autoplayer measurements in the balancing issue.
- Walking removes car load near jobs, so Modal shift triggers less often. Re-measure after each issue.
- Source: grilling session. Settled by the user: walking is a transport mode with trips to workplaces and services; implicit sidewalks, with Crossings and dead ends as the only crossings; trade-off between road capacity and walkability; stick figures for now; City Management shows the car / public transport / walking mix. Other design choices (thresholds, formula shape, weights) are the author's defaults.
