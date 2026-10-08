# 04: Arcade adjacency rules

**What to build:** Where Fixtures stand matters. Three readable rules move the service rate and attractiveness, computed from grid distances.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Counter near the entrance: service rate falls as the counter's distance to the entrance grows.
- [ ] Noise: two loud machines on adjacent cells lower attractiveness; quiet Fixtures never do.
- [ ] Table and chair pairs: a chair without a table in reach does not count for capacity.
- [ ] No pathfinding of simulated people: all rules use grid distances and are pure functions of the layout.
- [ ] The Management view marks Fixtures affected by a rule (a hint on hover or a marker), so the player learns why.
- [ ] Unit tests cover each rule alone and combined; moving a Fixture changes Takings on the next tick.
