# Flow Sources And Destinations

Status: resolved
Spec: ../spec.md

## What to build

On the Movement layers, mark the main sources of departure and the main destinations: the five busiest Homes the trips leave from and the five busiest buildings they go to, as beacons over the map (green for departures, pink for destinations, taller for the busier) and as two lists in the Analytics HUD, each entry showing the place on the map.

- Cars: Commuters per Home, and Commuters driving to each workplace.
- Pedestrians: walking trips per Home (to a workplace or to a service), and Pedestrians arriving at each workplace or facility.
- All: both added up.
- A Home with no road to a workplace is left out of the departures: no trip takes place.
- The core exposes the arrivals (`carArrivals`, `walkArrivals`) and the walking trips per Home (`walkTripsByHome`) without changing the Congestion results.

## Acceptance criteria

- [x] `flowEndpointsOf(state, layer)` pure, ranked busiest first, independent of building order, none for Data layers.
- [x] Beacons in the scene and the two lists in the HUD, each entry showing its tile.
- [x] Existing congestion and walking results unchanged.

## Comments

The first idea was arcs from each Home to its destination, shown on selection. It was replaced by this simpler reading of the main sources and destinations.
