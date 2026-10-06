# Walking trips to services

Status: ready-for-agent
Blocked by: 01

## What to build

Each Home generates walking trips to shops, schools, health, culture, casino and parks. They add no car demand, give Well-being, and load the Crossings on their path.

## Acceptance criteria

- [ ] Per-type weight and threshold in `GAME_CONFIG` (shop 12, school / health / culture 15, park 20)
- [ ] Nearest destination reachable on foot under the threshold, no destination capacity
- [ ] Parks and nature count as destinations for walking only
- [ ] No car load added by these trips
- [ ] Well-being benefit for Homes with walking access, with a cap
- [ ] Crossing load per tile exposed in the statistics
- [ ] Statistics expose walking trips by service type
- [ ] Unit tests: threshold, weight, no car load, Well-being, Crossing load, determinism

## Comments
