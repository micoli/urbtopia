# Scene bus in the traffic engine

Status: resolved
Blocked by: none

## What to build

The bus follows its route inside the TrafficLayer car-following engine, queues behind cars and stops at pedestrian Crossings.

## Acceptance criteria

- [x] One bus per active Bus line, on its route back and forth, bus model, nominal speed
- [x] Respects Lane gaps, node clearance and stopTiles; never passes through a car
- [x] Still yields to the BRT through priorityTiles
- [x] Nothing flows back to the core
- [x] Unit tests: stops behind a slower car, at a Crossing, for a BRT
- [x] Checked by eye in the dev server

## Comments

## Answer

`vehicleTraffic.ts`: `TrafficVehicle.run` (route back and forth), `startBusVehicle`, `nextRunTile`; the car-following engine is unchanged otherwise, so buses keep Lane gaps, node clearance and `stopTiles`. `TrafficLayer` adds one bus per active Bus line (rebuilt when the active routes change), renders them with the bus model fitted to 0.72 tiles, and counts only cars against the target. It still yields to a BRT through `priorityTiles`. `EcologyLayer` keeps signs and overlays but no longer animates buses; its tests were replaced. Checked in the dev server: five lines on the starting road queue behind each other, no console error. Cars stopping behind a bus not observed.
