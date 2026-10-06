# Scene bus in the traffic engine

Status: ready-for-agent
Blocked by: none

## What to build

The bus follows its route inside the TrafficLayer car-following engine, queues behind cars and stops at pedestrian Crossings.

## Acceptance criteria

- [ ] One bus per active Bus line, on its route back and forth, bus model, nominal speed
- [ ] Respects Lane gaps, node clearance and stopTiles; never passes through a car
- [ ] Still yields to the BRT through priorityTiles
- [ ] Nothing flows back to the core
- [ ] Unit tests: stops behind a slower car, at a Crossing, for a BRT
- [ ] Checked by eye in the dev server

## Comments
