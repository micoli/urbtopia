# Scene: no overlap, tint and red cross

Status: resolved
Blocked by: 02

## What to build

Make `TrafficLayer` a projection of the core Congestion model, with non-overlapping Vehicles and visual markers.

## Acceptance criteria

- [x] One Vehicle per Lane and segment; a Vehicle keeps a minimum gap to the one ahead; an intersection passes one Vehicle at a time
- [x] Spawn refused on an occupied Lane position
- [x] Vehicle count follows Commuters who drive, bounded by capacity and the existing ceiling (150, halved on touch)
- [x] Lane count visible on Road tiles by Road tier
- [x] Saturated sections tinted orange to red
- [x] Disconnected sections carry a red cross
- [x] Pure logic (gaps, lane occupancy, intersection) tested without `three`; rendering checked by eye
- [x] Traffic preference switch still disables everything cosmetic

## Comments

## Answer

- `src/scene/vehicleTraffic.ts`: car following (`MIN_GAP`), one-at-a-time intersections (`NODE_CLEARANCE`, priority by progress then id), lane choice on edge entry, spawn refusal. Pure and tested (`vehicleTraffic.test.ts`).
- `TrafficLayer` uses it; Vehicle count = `floor(Commuters / 10)` bounded by `floor(lane tiles / 2)` and the existing ceiling (150, halved on touch). Lateral offset spreads Vehicles over the Road tier's Lanes.
- `CongestionLayer` (+ pure `congestionMarkers.ts`): orange-to-red tint on saturated sections, red cross on disconnected sections, white Lane dividers on straight multi-Lane tiles. Not tied to the Traffic preference switch (gameplay information); only the Vehicles are.
- Core change: a city without Homes has no Commute, so the starting road (workplaces only) carries no red cross.
- Checked by eye in the dev server with a hand-made city (saturated tiered road, isolated road with a Home).
- Known limit: nothing lets the player upgrade Road tiers from the UI yet (command `UpgradeRoads` exists); to schedule with ticket 05 or a new ticket.
