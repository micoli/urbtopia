# Scene: no overlap, tint and red cross

Status: ready-for-agent
Blocked by: 02

## What to build

Make `TrafficLayer` a projection of the core Congestion model, with non-overlapping Vehicles and visual markers.

## Acceptance criteria

- [ ] One Vehicle per Lane and segment; a Vehicle keeps a minimum gap to the one ahead; an intersection passes one Vehicle at a time
- [ ] Spawn refused on an occupied Lane position
- [ ] Vehicle count follows Commuters who drive, bounded by capacity and the existing ceiling (150, halved on touch)
- [ ] Lane count visible on Road tiles by Road tier
- [ ] Saturated sections tinted orange to red
- [ ] Disconnected sections carry a red cross
- [ ] Pure logic (gaps, lane occupancy, intersection) tested without `three`; rendering checked by eye
- [ ] Traffic preference switch still disables everything cosmetic

## Comments
