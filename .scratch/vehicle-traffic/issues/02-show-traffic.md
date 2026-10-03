# Show Traffic that follows the population

Type: task
Status: claimed
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
- [ ] The road graph handles plain roads, dead ends and roundabouts.
- [ ] A Vehicle goes straight when it can, takes a random exit otherwise, and turns around at a dead end.
- [ ] A `TrafficLayer` renders Vehicles with one instanced mesh per model, reading state snapshots only.
- [ ] Vehicles spawn and despawn as the population and the roads change, out of view first.
- [ ] A "Traffic" switch in the preferences hides all Vehicles, with FR/EN labels.
- [ ] Typecheck, lint and the full test suite pass.

## Comments

Work in progress on branch `feat/traffic`: target count done, road graph under way.
