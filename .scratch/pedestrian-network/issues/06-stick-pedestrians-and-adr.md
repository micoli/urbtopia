# Stick-figure pedestrians and ADR amendment

Status: ready-for-agent
Blocked by: 01

## What to build

Cosmetic pedestrian layer (stick figures) walking on sidewalks and crossing at Crossings, and the ADR 0011 amendment.

## Acceptance criteria

- [ ] Stick-figure pedestrians walk along sidewalks and cross at Crossings, same rules as vehicles: never saved, no effect on the core
- [ ] Bounded count (about 100), proportional to walking trips
- [ ] Cars stop visually at a Crossing while a pedestrian crosses
- [ ] Placeholder figure is easy to replace by a real asset later
- [ ] ADR 0011 amended: walking as a third aggregate mode, pedestrians as a cosmetic projection
- [ ] Glossary: **Pedestrian path**, **Walking trip**, **Sidewalk side** added; **Commute** updated
- [ ] Checked by eye in the dev server

## Comments
