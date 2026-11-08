---
status: accepted
---

# A Venue's Staff counts in proportion to its Fill rate

Amends [ADR 0059](0059-every-citizen-looks-for-a-job-and-picks-the-mode-by-travel-time.md) for Venues. Unemployed stays a statistic.

**The trigger.** A Venue's Jobs are its hired Staff, and the Commute fills them like any Job. The panel showed `filled / hired`, but the rules read only the hired Staff: a Venue whose Staff nobody came to work for performed as if complete, while the player paid every wage.

**The rule.** A Venue's **Fill rate** is its filled Jobs over its hired Staff (1 with no Staff, and 1 during an Adaptation period). The Staff the rules see is the hired Staff times the Fill rate: the front rate, the security rate, the manager yield, the cook, the bartender, the waiters and the housekeepers all follow it. Wages are still paid on the hired Staff, and the hiring conditions (manager required, posts of the Tier) still read the hired Staff.

**Presence is proportional.** A role that was all or nothing (a manager, a security guard, a cook, a bartender) now counts for `min(1, hired)`, so half a manager gives half the yield. With whole numbers the result is unchanged.

**Hiring changes the Commute.** The layout signature of the Commute now includes each workplace's Jobs: hiring or releasing Staff used to leave the filled Jobs stale until the layout changed.

## Considered options

- **Keep the rules on hired Staff.** Rejected: the Jobs shown and the Staff that counts stayed two different figures, and hiring without Citizens to come was free of consequence.
- **All or nothing under a threshold.** Rejected: a cliff the player cannot read, where proportion shows on the panel.

## Consequences

- A Venue far from any Home, or in a city with few Citizens, earns less with the same Staff. Balancing may be needed.
- Tests that hire Staff need a Home and a road for the Staff to come from (`src/core/venues/commuteRoad.ts`).
