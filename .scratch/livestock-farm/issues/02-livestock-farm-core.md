# Livestock farm: Slots, Feed from the Grain silo, species unlock

Status: resolved
Blocked by: 01

New Production building `livestock-farm` (Workshop, 5 Tiers, Build limit 3 at 300/800 Citizens, section `build.agriculture`).

- Recipe = species; each cycle consumes one Feed (Corn poultry, Wheat ruminants, Mulberry leaves silkworm) from the Grain silo; Slot waits without Feed.
- Species unlock by Citizens per recipe, not by Tier.
- Power, road, Jobs, Commute like other Workshops. Sell refused if storage could not hold the stock.
- Tests first (TDD): production, Feed consumed once per cycle, wait without Feed, offline catch-up, unlock thresholds.
- Done when: a Livestock farm placed in a test city produces eggs from Corn.

## Answer

`assets/defs/buildings/livestockFarm.json` (kind production, `build.agriculture`, 80 Citizens, Build limit 3 at 300/800), Mill-like Tiers; it reuses the Farm barn model as a placeholder until issue 07. `productionTypes.ts` gives it Workshop weight and emissions and recipes scaled by yield; `items.ts` lists its Materials. Feed is the recipe input, so Slot waiting is `error.missingMaterials` at queue time (as for the Mill). Tests in `src/core/economy/livestockFarm.test.ts`.
