# 04: Arcade adjacency rules

**What to build:** Where Fixtures stand matters. Three readable rules move the service rate and attractiveness, computed from grid distances.

**Blocked by:** 03

**Status:** done

- [x] Counter near the entrance: service rate falls as the counter's distance to the entrance grows.
- [x] Noise: two loud machines on adjacent cells lower attractiveness; quiet Fixtures never do.
- [x] Table and chair pairs: a chair without a table in reach does not count for capacity.
- [x] No pathfinding of simulated people: all rules use grid distances and are pure functions of the layout.
- [x] The Management view marks Fixtures affected by a rule (a hint on hover or a marker), so the player learns why.
- [x] Unit tests cover each rule alone and combined; moving a Fixture changes Takings on the next tick.

## Comments

- Rules live in `src/core/venues/layout.ts`, with their constants in `LAYOUT`. The counter rate is `1 - 0.06 x (distance - 1)`, floored at 0.6; no counter gives 0.5. A noisy pair costs 8% attractiveness, floored at 50%. A table takes four seats; a bar stool may also sit at a counter. A seat adds 2 plays per hour.
- Affected Fixtures get an orange marker in the interior; selecting one shows the reason.
- Ticket 03 note: the panel shows earnings per hour, not per day, and Visitors do not depend on Road or BRT access yet.
