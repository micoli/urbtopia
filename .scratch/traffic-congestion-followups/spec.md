# Traffic congestion follow-ups

Status: ready-for-agent

Follow-up to [traffic-congestion](../traffic-congestion/spec.md). Covers the three tickets deferred during its grilling session: [limited jobs](../traffic-congestion/issues/01-limited-jobs.md), [dynamic modal shift](../traffic-congestion/issues/07-dynamic-modal-shift.md) and [camera jump to the worst bottleneck](../traffic-congestion/issues/08-camera-jump-to-bottleneck.md). Vocabulary (**Commute**, **Commuter**, **Lane**, **Road tier**, **Congestion**, **Rider**, **Bus line**) is in `CONTEXT.md`. Respects [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md): congestion stays an aggregate core model, no individual Citizen journeys.

## Problem Statement

Congestion works, but three things make it feel unfinished to the player. Workplaces absorb unlimited Commuters, so a single Factory can "employ" the whole city and every road converges on it. A city that adds a Bus line sees no reaction to its own traffic jams: public transport only follows coverage, never need. And when the city is jammed, the player is told a number, but has to hunt on the map for the road that is the problem.

## Solution

Workplaces get a limited number of jobs, so Commuters fill the nearest workplaces first and the rest of the city's flow spreads out realistically. When roads are saturated, some Commuters living within reach of an active public transport line switch to it, within that line's spare capacity, so a Bus line is visibly rewarded where it helps. The Traffic section of City Management gets a button that closes the panel and centres the camera on the worst bottleneck.

## User Stories

1. As a player, I want each workplace to offer a limited number of jobs, so that a single building cannot absorb the whole city's Commuters.
2. As a player, I want Commuters to fill the nearest workplaces first, so that building workplaces close to Homes shortens trips and relieves roads.
3. As a player, I want a higher Tier workplace to offer more jobs, so that upgrading a Workshop or Factory has a traffic consequence as well as a production one.
4. As a player, I want every kind of workplace (Workshop, Factory, Shop, Public facility, Leisure building) to count for jobs, so that the commute model matches the buildings I see.
5. As a player, I want Commuters who find no job to simply not drive, so that a shortage of jobs does not create phantom traffic.
6. As a player, I want to see how many jobs exist against how many Commuters there are, so that I know when I need more workplaces.
7. As a player, I want a Home that cannot reach any workplace to still show as disconnected, so that the red cross rule keeps working.
8. As a player, I want job assignment to be the same on every reload and in catch-up, so that my city does not change between sessions.
9. As a player, I want my existing city to load without surprise, so that adding job limits does not suddenly raise my Congestion or lower Well-being unfairly.
10. As a player, I want an Adaptation period for cities saved before job limits, so that I have time to react to the new rule.
11. As a player, I want Commuters to switch to public transport when roads are saturated, so that building a Bus line pays off where traffic is worst.
12. As a player, I want the switch to be limited by the spare capacity of the line, so that a small line cannot absorb a whole district.
13. As a player, I want the switch to apply only to Homes within reach of an active line, so that coverage still matters.
14. As a player, I want no switch when roads are not saturated, so that the existing coverage-based ridership is unchanged in a calm city.
15. As a player, I want the amount of switching to grow with how saturated the road is, so that mild congestion moves few people and severe congestion moves more.
16. As a player, I want the shifted Riders counted with the other Riders, so that the transport panel and the mix stay consistent.
17. As a player, I want the number of Vehicles on the roads to drop when Commuters switch, so that the scene reflects the change.
18. As a player, I want Congestion and the Well-being penalty to reflect the shift, so that building transport visibly improves my city.
19. As a player, I want the shift to be calculated in a single step, so that it is deterministic and the result does not oscillate.
20. As a player, I want to see in City Management how many Riders come from the congestion shift, so that I understand the effect of my Bus lines.
21. As a player, I want no individual Citizen to be tracked, so that the simulation stays understandable and light.
22. As a player, I want a button in the Traffic section to go to the worst bottleneck, so that I find the road to widen without searching.
23. As a player, I want the button to close City Management and centre the camera on that road, so that I see the map immediately.
24. As a player, I want the button to be hidden or disabled when no road is saturated, so that it never sends me to a healthy road.
25. As a player, I want the "worst" bottleneck to be the most overloaded tile, with ties settled consistently, so that the button always goes to the same place for the same city.
26. As a player, I want the button to work with touch as well as mouse, so that it is usable on phone and tablet.
27. As a player, I want the button labelled in French and English, so that it matches the rest of the panel.
28. As a player, I want keyboard access to the button and focus returned sensibly after the panel closes, so that the panel stays accessible.
29. As a maintainer, I want job capacities and the shift parameters in the balancing document, so that they can be tuned without changing the rules.
30. As a maintainer, I want the three features to build on the existing congestion statistics, so that no second traffic model appears.

## Implementation Decisions

- **Jobs.** Each workplace gets a job capacity derived from its type and Tier (and Slots for production buildings). The Commute assignment changes from an even split over all reachable workplaces to filling by path proximity: for each Home, in stable Home order, Commuters take jobs at the nearest workplaces with free capacity, in stable workplace order for ties. Commuters left without a job are not Commuters of the road network that day: they add no load and no penalty. The total of jobs and unemployed Commuters is exposed with the congestion statistics.
- **Disconnection is unchanged.** A Home with no road path to any workplace stays disconnected at maximum Congestion; a disconnected road section keeps its red cross. Unemployment is not disconnection.
- **Jobs have no Well-being effect in this spec.** A shortage of jobs is informational only (panel).
- **Modal shift.** One non-iterative pass after the base car load is computed: for each Home whose bottleneck ratio exceeds 1 and that is covered by an active public transport line with spare capacity, a share of its car Commuters becomes Riders. The share grows with the excess ratio up to a maximum fraction, and is bounded by the line's spare capacity, allocated in stable Home order. Congestion is then recomputed once with the reduced car load. No loop, so the result is deterministic and cannot oscillate.
- **Riders.** Shifted Riders are reported with the existing Rider totals and also as a separate figure, so the panel can explain them. Public transport operating cost and emissions follow the existing rules for Riders; a line never carries more than its capacity.
- **Interface of the congestion statistics** gains: jobs offered, Commuters without a job, Riders shifted by congestion, and the worst bottleneck (tile and ratio, or none). Existing fields keep their meaning.
- **Camera jump.** The Traffic section shows a button when at least one section is saturated. Choosing it closes City Management and asks the scene to centre on the worst bottleneck. The worst bottleneck is the section with the highest ratio, ties broken by highest load, then by stable tile order. The scene already has a way to focus the camera on a tile; the UI store gains an action that closes the panel and requests it.
- **Save.** Job capacities and shifts are derived, not saved. If job limits are enabled for cities saved before this change, migrated saves receive an Adaptation period, using the existing mechanism and a new save version only if a persisted field is added (none is expected).
- **Glossary.** Add **Job** (a place at a workplace that a Commuter can fill) and **Modal shift** (Commuters moving from car to public transport because of Congestion) to the glossary when implemented; **Commute** is updated to say workplaces have a job limit.
- **ADR.** If job limits or the shift change the aggregate-model boundary in a way ADR 0011 does not cover, record a short amendment; otherwise none.

## Testing Decisions

- A good test checks external behaviour: given a city, what the congestion statistics, Riders and Well-being are, and what the user sees. It never checks the order of internal loops.
- **Seam 1 (core):** the congestion statistics, with the Home Well-being benefits for the penalty effect. Cover: jobs filled nearest first and capped; unemployed Commuters adding no load; deterministic assignment across repeated calls and catch-up; shift only above ratio 1, only within coverage, bounded by spare line capacity, proportional to the excess; the second pass lowering ratios; Rider totals consistent with the transport statistics; worst bottleneck choice with tie-breaks and the "none" case. Prior art: the existing congestion and congestion Well-being tests.
- **Seam 2 (interface):** the City Management render test, for the button's presence only when something is saturated, the FR/EN labels and no `NaN` or `undefined`; plus the UI store action that closes the panel and requests the camera focus, tested at the store level with a stubbed scene handler. Prior art: the City Management panel tests and the store tests.
- Rendering and camera movement are checked by eye in the dev server, as for the other traffic work.

## Out of Scope

- Individual Citizen journeys or per-Citizen jobs.
- Unemployment effects on Well-being, Tax or progression.
- Choosing workplaces by wage or type preference.
- Iterating the modal shift to a fixed point, or shifting Citizens between several lines with Transfers beyond existing Itinerary rules.
- Moving Riders back to cars when roads clear (the shift is recomputed each time, so it follows the current state; no memory).
- Any change to Lane capacities, Road tier prices or the penalty cap.
- Animating the camera path to the bottleneck beyond what the existing focus does.

## Further Notes

- Specific numbers (jobs per Tier, maximum shift fraction, spare-capacity rules) are not decided here; they belong in the balancing document next to the existing congestion values and should be set from headless autoplayer measurements, as was done for the first delivery.
- Modal shift and job limits interact: nearer jobs shorten paths and lower loads, so the shift will trigger less often. Re-measure after each change.
- Design choices in this spec (single-step shift, unemployed Commuters not driving, Well-being untouched by jobs, button closing the panel) are the author's defaults from the earlier discussion, not points the user explicitly settled; revisit them if the first implementation feels wrong.
