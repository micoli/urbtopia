# Transit reach

Status: Implemented

Vocabulary is defined in `CONTEXT.md` (Transit reach, Service coverage, Transit itinerary, Transit hub, BRT station, Railway station). Decision record: [ADR 0042](../../docs/adr/0042-transit-reach-extends-service-coverage-over-fast-lines.md).

## Confirmed decisions

- Stops that extend reach: BRT station, Railway station, Transit hub. Ordinary Bus stops never do.
- Service categories extended: Education, Administration, Culture, Health, Safety. Waste is excluded (it keeps its road link, ADR 0039). Facilities that already cover the whole city are unchanged.
- A Home is covered through Transit reach when a stop A within the stop coverage distance of the facility and a stop B within the stop coverage distance of the Home are joined by a Transit itinerary (at most two Transfers) whose travel time is under the threshold. The cyclist ×3 stop coverage does not apply.
- Travel time counts vehicle time, waiting and Transfers. The walk to the stop is excluded (already bounded by the stop coverage distance).
- One global threshold, in Balance data (ADR 0023). Initial value chosen by test: a School 40 tiles from a district, joined by one BRT line; the BRT should visibly bring the district into reach without covering the whole city.
- Same Citizen capacity as direct reach. Homes in direct reach first; then Homes reached by transit, from the shortest travel time. The Home that crosses the capacity is still served.
- A Home covered by Transit reach counts exactly like a directly covered one: Well-being, Home Tier upgrades, Needs, Sanctions, Objectives.
- Independent of line load: coverage takes no place on the lines (ADR 0007 is not involved). Only the existence of the link and its travel time count.
- BRT-only access Homes follow the same rule, no special case.
- Derived state, never saved, no save version bump. Recomputed when buildings, lines or roads change, not on every tick.
- A line made inactive (route cut, no vehicle assigned) or a removed station withdraws its Transit reach at the next recompute. No Adaptation period: the player caused it.

## UI scope

- Selecting a facility shows the Transit reach cells in the same overlay as the direct square, in a distinct tint.
- The Home panel names the cause of its coverage ("covered via station X"), like Waste coverage names its cause.
- A dynamic Codex page ("Transit reach", section `build.transport`), built like the Waste page from live figures computed in `core` (a `transitReachCodexFigures(state)` function). It shows: the global threshold, the stops that extend reach, the Service categories concerned and excluded, the number of Homes covered by direct reach versus by Transit reach per category, and the facilities with their reached Homes. Texts are English and French in i18n; no figure is hard-coded in the page.
- The Codex entries of the Public facilities and of the BRT station, Railway station and Transit hub link to this page.

## Not in scope

- A threshold per Service category.
- Ordinary Bus stops extending reach.
- Reach for Waste.
