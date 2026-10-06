# Buses in traffic

Status: resolved

Follow-up to [traffic-congestion](../traffic-congestion/spec.md), [traffic-congestion-followups](../traffic-congestion-followups/spec.md), [pedestrian-network](../pedestrian-network/spec.md) and [dedicated-transit](../dedicated-transit/spec.md). Vocabulary (**Bus line**, **Bus stop**, **Headway**, **Congestion**, **Modal shift**, **Vehicle**, **Rider**) is in `CONTEXT.md`. Respects [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md): congestion stays an aggregate core model, scene vehicles are a projection that never feeds back into the core.

## Problem Statement

Buses ignore traffic. In the scene a bus is a decorative sprite that drives through cars at a constant speed (`EcologyLayer`). In the core a Bus line has a fixed speed (2), capacity (120) and Headway (15), and the only link with Congestion is that jams add Riders through Modal shift. A bus caught in a traffic jam is as fast and as full as one on an empty road, so the player has no reason to prefer a BRT or to relieve a congested road for the sake of a Bus line.

## Solution

A bus is a vehicle like any other on an ordinary road. In the core, each active Bus line loads the roads it drives on and is slowed by the Congestion of its route: its effective speed drops with the jammed tiles it crosses, which lowers its capacity and makes it less attractive for itineraries and for Modal shift. In the scene, the bus joins the car-following engine, queues behind cars and stops at pedestrian Crossings; cars spawn more on saturated roads so that the jam the core reports is the jam the player sees. City Management shows each line's effective speed and capacity. BRT and rail keep their own networks and are immune to road Congestion. Ambulances, fire trucks and police cars keep their priority, with a configuration switch to subject them to traffic too.

## User Stories

1. As a player, I want a bus to queue behind cars, so that it cannot drive through them.
2. As a player, I want a bus to stop at a pedestrian Crossing used by pedestrians, so that it behaves like other vehicles.
3. As a player, I want a bus to still give way to a BRT at a crossing, so that dedicated transit keeps its priority.
4. As a player, I want a bus on a jammed road to be slower, so that Congestion costs my Bus lines something.
5. As a player, I want a slowed Bus line to carry fewer Riders, so that a jammed road makes it less useful.
6. As a player, I want a slowed Bus line to be less attractive for itineraries, so that faster lines are preferred.
7. As a player, I want each Bus line to add load to the roads it uses, so that a bus is a vehicle like another.
8. As a player, I want the bus load to be the same whatever its speed, so that results are stable and do not oscillate.
9. As a player, I want only active lines to load the roads, so that a broken line does not cause traffic.
10. As a player, I want BRT and rail not to load roads and not to be slowed by them, so that dedicated networks keep their advantage.
11. As a player, I want a road with only buses to be able to become saturated, so that I understand why a bus-only street is slow.
12. As a player, I want the bus speed to drop at most to half of its nominal speed, so that a jam never stops a line completely.
13. As a player, I want the slowdown to count every jammed tile of the route, so that a long jammed road costs more than a short one.
14. As a player, I want the slowdown computed before Modal shift and kept fixed in that calculation, so that the result is deterministic.
15. As a player, I want the same city to give the same bus speeds on every reload and catch-up, so that nothing changes between sessions.
16. As a player, I want each line's effective speed and capacity in the transport section of City Management, so that I see which lines suffer.
17. As a player, I want a line marked as slowed by traffic below 90% of its speed, so that I notice it.
18. As a player, I want the number of slowed lines in the traffic section, so that I see the effect of Congestion on public transport.
19. As a player, I want FR/EN labels for every new element, so that it matches the rest of the UI.
20. As a player, I want cars to appear preferably on saturated roads, so that a jam reported by the model looks like a jam.
21. As a player, I want cars to still appear elsewhere, so that quiet roads are not empty.
22. As a player, I want the scene never to change the core, so that Well-being and Tax do not depend on frame rate or camera.
23. As a player, I want ambulances, fire trucks and police cars to keep their priority by default, so that nothing changes for emergency services.
24. As a maintainer, I want a configuration constant that makes emergency vehicles follow traffic like buses, so that the behaviour can be switched.
25. As a maintainer, I want the bus load, speed floor and thresholds in the balancing document, so that they can be tuned without changing rules.
26. As a maintainer, I want bus speed and load to build on the existing congestion statistics and caches, so that no second traffic model appears.

## Implementation Decisions

- **Bus load.** Each active Bus line adds a constant load (starting value 20 car equivalents) on every tile of its route. Outbound and return count together, since capacity ignores direction. Inactive lines add nothing. BRT and rail add nothing. The load is added to the existing sections and can create sections on tiles that only buses use. Worst bottleneck, saturated section count, tint and Congestion index follow from those sections as for any other load.
- **Effective speed.** Per active Bus line, each route tile costs `1 + excess`, with `excess = max(0, ratio - 1)` of its section (ratio clamped to the maximum ratio, 2), tiles without a section costing 1. The effective speed is the nominal bus speed multiplied by the route length divided by the sum of the costs, so never below 50% of the nominal speed. The speed is a statistic of the congestion model, with the ratio of effective to nominal speed.
- **Capacity and itinerary.** Effective capacity of a Bus line is `capacity × effective speed ÷ nominal speed`. Itinerary times use the effective speed for bus lines. BRT and rail are unchanged. Modal shift spare capacity uses the effective capacity.
- **Order of computation.** One pass, no iteration, as for Modal shift. Pass 1 computes the car and bus loads and the effective speeds. Those speeds feed the transport statistics (capacity and itineraries) and Modal shift, then congestion is recomputed once with the new Riders. The speeds exposed to the UI are those of pass 1. Bus load does not depend on speed, so there is no loop.
- **Scene bus.** The bus joins the `TrafficLayer` car-following engine (Lanes, minimum gap, node clearance, `stopTiles` for pedestrian Crossings). It keeps following its line route back and forth, one bus per active line, with a bus model and the nominal speed. It still yields to a BRT through `priorityTiles`. It does not read the core speed and nothing flows from the scene back to the core. No visual stop at bus stops in this spec.
- **Car spawning.** `TrafficLayer` weights the random choice of the spawn tile by the congestion ratio of the section (higher weight above ratio 1), keeping a floor weight so quiet roads still get cars. Scene only.
- **Emergency vehicles.** Default behaviour is unchanged. A configuration constant `SERVICE_VEHICLES_FOLLOW_TRAFFIC` (off by default, not exposed in Settings) makes ambulances, fire trucks and police cars use the same car-following engine as buses, with no priority.
- **City Management.** The transport section shows, per Bus line, the effective speed in % of nominal, the effective capacity, and a "slowed by traffic" mention below 90%. The traffic section shows the number of slowed lines. FR/EN strings, one React component per file. No map marker.
- **Cache and save.** Everything is derived; no persisted field and no save version change. The congestion layout signature already covers Bus lines through the transport statistics; it must also cover the route tiles.
- **ADR 0011 amendment** records buses as vehicles that load and suffer Congestion. Glossary adds **Effective speed**; **Bus line** and **Traffic** are updated.

## Testing Decisions

- A good test checks external behaviour: given a city, what the congestion statistics, line speeds and capacities, Riders and what the user sees are. It never checks the order of internal loops.
- **Seam 1 (core):** congestion and transport statistics. Cover: bus load on the route tiles of active lines only; a bus-only tile becoming a saturated section; effective speed from the sum of costs, floor at 50%; unaffected BRT and rail; lower capacity and longer itinerary time with a slower line; Modal shift bounded by the effective capacity; one pass and determinism across calls and catch-up. Prior art: `congestion.test.ts`, `modalShift.test.ts` and the transport tests.
- **Seam 2 (scene):** the pure car-following and spawning helpers: a bus stops behind a slower car, at a Crossing and for a BRT; spawn weights above ratio 1 and a floor elsewhere; emergency vehicles keep priority by default and follow traffic when the constant is on. Prior art: `vehicleTraffic.test.ts`, `TransitLayer.test.ts`.
- **Seam 3 (interface):** the City Management render test for per-line speed and capacity, the "slowed" mention only below 90%, the slowed line count, FR/EN labels and no `NaN` or `undefined`. Prior art: `CityManagement.test.tsx`.
- Rendering is checked by eye in the dev server.

## Out of Scope

- Visual stop of the bus at its bus stops, dwell times and boarding animations.
- Several buses per line, or a number of buses linked to the Headway.
- Bus lanes on roads of tier 2 or 3 (only the BRT protects a line from Congestion).
- Bus load that depends on speed or Headway, or a fleet needed for bus lines.
- Any change to BRT, rail, their priority at crossings or their capacities.
- A player-facing setting for emergency vehicles.
- Map markers for slowed lines.

## Further Notes

- All numbers (bus load 20, speed floor, 90% threshold, spawn weights) are the author's starting values, to be set from headless autoplayer measurements in the balancing issue.
- Bus load adds to the load of tiles that cars already use, so cities with many Bus lines on a trunk road will show slightly more Congestion than before. Re-measure after each issue; an Adaptation period is only needed if that raises the Congestion penalty of existing cities.
- Source: grilling session. Settled by the user: buses are vehicles subject to traffic and cannot go through cars; buses load the roads; emergency vehicles keep priority with an option to subject them. The other design choices are the author's defaults.
