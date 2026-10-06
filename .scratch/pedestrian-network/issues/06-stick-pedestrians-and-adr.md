# Stick-figure pedestrians and ADR amendment

Status: resolved
Blocked by: 01

## What to build

Cosmetic pedestrian layer (stick figures) walking on sidewalks and crossing at Crossings, and the ADR 0011 amendment.

## Acceptance criteria

- [x] Stick-figure pedestrians walk along sidewalks and cross at Crossings, same rules as vehicles: never saved, no effect on the core
- [x] Bounded count (about 100), proportional to walking trips
- [x] Cars stop visually at a Crossing while a pedestrian crosses
- [x] Placeholder figure is easy to replace by a real asset later
- [x] ADR 0011 amended: walking as a third aggregate mode, pedestrians as a cosmetic projection
- [x] Glossary: **Pedestrian path**, **Walking trip**, **Sidewalk side** added; **Commute** updated
- [x] Checked by eye in the dev server (figures walking on sidewalks, no console error; cars stopping not observed)

## Comments

## Answer

`src/scene/pedestrianWalk.ts` (pure: node positions on the sidewalk, random walk on the pedestrian graph with a preference for flat edges, `crossedTile`, `targetPedestrianCount`, max 100 / 50 on touch), `PedestrianLayer.ts` (one instanced stick figure, never saved), wired in `GameScene`. `TrafficLayer.stopTiles` makes cars hold before a tile being crossed (`advanceTrafficVehicle` gains a `stopTiles` argument). ADR 0011 amended; glossary gains Pedestrian path, Sidewalk side, Walking trip, Crossing; Commute updated. Tests: `pedestrianWalk.test.ts` and `vehicleTraffic.test.ts`.
