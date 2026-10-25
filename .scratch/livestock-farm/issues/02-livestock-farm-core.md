# Livestock farm: Slots, Feed from the Grain silo, species unlock

Status: ready-for-agent
Blocked by: 01

New Production building `livestock-farm` (Workshop, 5 Tiers, Build limit 3 at 300/800 Citizens, section `build.agriculture`).

- Recipe = species; each cycle consumes one Feed (Corn poultry, Wheat ruminants, Mulberry leaves silkworm) from the Grain silo; Slot waits without Feed.
- Species unlock by Citizens per recipe, not by Tier.
- Power, road, Jobs, Commute like other Workshops. Sell refused if storage could not hold the stock.
- Tests first (TDD): production, Feed consumed once per cycle, wait without Feed, offline catch-up, unlock thresholds.
- Done when: a Livestock farm placed in a test city produces eggs from Corn.
