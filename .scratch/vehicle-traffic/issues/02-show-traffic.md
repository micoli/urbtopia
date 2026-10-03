# Show Traffic that follows the population

Type: task
Status: resolved
Blocked by: 01

## What to build

Vehicles drive along the roads, their number following the city's total Citizens. See the decisions in `../spec.md`.

## Seams under test

- `targetVehicleCount`: Citizens, road tiles and touch flag in, Vehicle count out.
- `buildRoadGraph` and `neighboursOf`: city state in, road adjacency out (plain roads, dead ends, roundabout ring).
- Next-tile choice: graph, current tile, previous tile and an injected random value in, next tile out.

The rendering layer is not tested automatically.

## Acceptance criteria

- [x] `targetVehicleCount` follows the sizing rule.
- [x] The road graph handles plain roads, dead ends and roundabouts.
- [x] A Vehicle goes straight when it can, takes a random exit otherwise, and turns around at a dead end.
- [x] A `TrafficLayer` renders Vehicles with one instanced mesh per model, reading state snapshots only.
- [x] Vehicles spawn and despawn as the population and the roads change, out of view first.
- [x] A "Traffic" switch in the preferences hides all Vehicles, with FR/EN labels.
- [x] Typecheck, lint and the full test suite pass.

## Answer

Rules (`trafficTarget`, `roadGraph`, `roadWalk`) are covered by Vitest. `TrafficLayer` and `vehicleMotion` render and move the Vehicles; checked by eye in the browser with a 34-tile road network and 1600 Citizens (17 Vehicles, on their lane, no console error). The full suite (324 tests), typecheck and lint pass.

Not covered by a test, by agreement: the rendering and the movement interpolation.
