# Traffic congestion

Make Traffic a game mechanic: Commuters who drive load the Roads, Roads have Lanes, and Congestion lowers Well-being. Agreed in a grilling session on 2026-10-05; vocabulary (**Commute**, **Commuter**, **Lane**, **Road tier**, **Congestion**) is in `CONTEXT.md`.

Supersedes the "cosmetic only" decision of [vehicle-traffic](../vehicle-traffic/spec.md) and amends [ADR 0005](../../docs/adr/0005-local-energy-and-coverage-based-mobility.md) through [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md) (Vehicles stay a visual projection, but of a core model).

## Decisions

- **Core vs scene**: the pure core computes an aggregate Congestion model (load ÷ capacity per Road section); deterministic, injected clock, catch-up compatible (ADR 0002). The scene projects it into Vehicles. No per-Citizen simulation.
- **Lanes**: a Road tile has a Road tier giving 1, 2 or 3 Lanes per direction, upgraded with Urbs. Capacity of a section is set by its Lanes; the bottleneck of a Commute is its lowest-capacity section.
- **Commute**: the Citizens of each Home who do not use public transport (Citizens − Riders) are the Commuters. They spread over all workplaces (Workshop, Factory, Shop, Public facility, Leisure building) and their load is assigned to the shortest road path. Workplaces have no job limit ([ticket 01](issues/01-limited-jobs.md), deferred).
- **Disconnection**: a connected set of Roads that serves Homes but no workplace, or workplaces but no Home, is a disconnected section. It is marked with a red cross in the scene; its Homes get the maximum Congestion.
- **Well-being**: per Home, no penalty up to 100% load on the bottleneck, then a linear penalty capped (about 20 points, tunable). Shown next to the coal penalty. An Adaptation period applies to already-saved cities, not to newly built Roads. Disconnected Homes take the maximum penalty.
- **No overlap**: in the scene, one Vehicle per Lane and segment at a time, a Vehicle follows the one ahead with a minimum gap, an intersection lets one Vehicle through at a time. Vehicle count stays bounded by capacity and by the existing ceiling (150, halved on touch).
- **Visual feedback**: saturated sections are tinted orange to red; disconnected sections carry the red cross.
- **Modal mix**: Riders stay those of existing coverage-based public transport; no dynamic modal shift in this delivery ([ticket 07](issues/07-dynamic-modal-shift.md)).
- **City Management**: a Congestion tile in the overview (city index weighted by Citizens, alert above 100%, link to the transit tab); a Traffic section (Commuters by car vs Riders as a mix in %, saturated sections, disconnected sections); a congestion line in the Well-being section.
- **Save**: Road tier is persisted with a version migration; Vehicles and Congestion values are derived, not saved.
- **Balancing**: Lane capacities (starting point 6 / 14 / 24 Commuters per tile for 1 / 2 / 3 Lanes), Road tier prices and the penalty cap live in `balancing.md`, tunable without changing the rules.

## Tickets

1. [Limited jobs at workplaces](issues/01-limited-jobs.md) (deferred)
2. [Core Congestion model](issues/02-core-congestion-model.md)
3. [Well-being penalty and save](issues/03-wellbeing-penalty-and-save.md)
4. [Scene: no overlap, tint and red cross](issues/04-scene-vehicles-and-markers.md)
5. [City Management traffic panel](issues/05-city-management-traffic-panel.md)
6. [Balancing and ADR](issues/06-balancing-and-adr.md)
7. [Dynamic modal shift](issues/07-dynamic-modal-shift.md) (deferred)
8. [Camera jump to the worst bottleneck](issues/08-camera-jump-to-bottleneck.md) (deferred)

Order: 2 → 3 → 4 and 5 in parallel → 6.
