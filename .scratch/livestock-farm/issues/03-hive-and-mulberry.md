# Hive perennial and Mulberry tree

Status: resolved
Blocked by: 01

- Hive: placeable like an Orchard tree (ADR-0036 pattern), no water, no road, Honey for Harvest, biodiversity and Well-being, no cooling. Unlock 80 Citizens.
- Mulberry tree: Orchard tree producing Mulberry leaves (crops compartment, 600 Citizens, water demand 1).
- Tests: cycle restarts after Harvest, ready produce lost on removal, no cooling from Hive.
- Done when: both can be placed, harvested, saved and reloaded.

## Answer

`hive.json` and `mulberryTree.json` are `green` buildings like the other orchard trees (both reuse the cherry tree model until issue 07; the Hive has no cooling). `src/core/economy/orchards.ts` now holds the single table of orchard buildings (fruit, cycle, water) used by placement, Collect and the water demand, replacing three hard-coded copies. Hive needs no water; Mulberry tree needs one unit. Tests in `orchardPerennials.test.ts`. The codex production chains page is left to issue 06.
