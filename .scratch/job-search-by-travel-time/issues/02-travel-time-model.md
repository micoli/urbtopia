# 02: Travel time by walk, bicycle, car and public transport

Status: ready-for-agent
Blocked by: 01

**What to build:** Pure functions that give the Travel time in minutes from a Home to a workplace for each mode, in `src/core/traffic/`, and the data they need. Not yet used by the Commute.

- [ ] Walking and cycling times follow the cost of the path on the Pedestrian path network, cycling three times faster (ADR 0038); thresholds unchanged.
- [ ] Car time is the length of the shortest road path divided by the speed of each Road section, which can be passed slowed by Congestion (free-flow by default).
- [ ] The speed per Road tier is data under `assets/defs`, validated by its schema (ADR 0021).
- [ ] Transit time is the minutes of the best itinerary, as computed today, plus the walk to the first stop.
- [ ] Vitest: each mode on a small grid; a Roundabout and a Crossing do not break the car time; no route returns `null`, never `Infinity`.

## Comments
