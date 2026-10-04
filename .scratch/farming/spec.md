# Farming

Status: ready-for-human
Completion: completed

## Confirmed scope

- The player builds a Farm, lays Field tiles on free owned land, plants Crops with Seed packs and harvests them.
- The Farm holds a seed stock of its own; the Storehouse and Silo never hold Seed packs.
- Seed packs are bought with Urbs. Each Crop species is made available by an Unlock.
- A Harvest yields a Crop Material, stored in the Materials compartment (Storehouse/Silo) like any other Material and never sold directly. A species-specific share of the yield is converted automatically into Seed packs instead of being stored.
- A Packhouse packs Crop Materials into packed Goods, sold in Shops or to the Market like any other Good.
- Water: a planted Field tile adds water Demand until its Crop is ready. Planting is refused when the extra Demand would exceed water Capacity. A Crop already planted is never penalised afterwards.
- Growth runs on game time and is applied by Catch-up (up to 48 game hours), like production.

## Field tiles

- Laid and removed by dragging a brush over free tiles of owned Parcels (no building, road or nature element).
- Laying costs 5 Urbs per tile; removing is free. Removing a planted Field loses its Crop with no refund.
- The number of Field tiles is capped by the Farm's Tier.

## Farm

- Single Farm building with Tiers (ADR 0004). Tier raises the seed stock capacity and the Field tile cap.
- One Farm per city; its seed stock is shared by every Field of the city, with no range.
- Cost 200 Urbs, footprint 2×2, requires a road, unlocked at 20 Citizens.
- Upgrade costs reuse `PRODUCTION_UPGRADE_COSTS` (Tiers 2 to 5).
- When the seed stock is full, the surplus of Seed packs from a Harvest is lost; the stored share is unchanged.

| Tier | Seed stock capacity (packs, all species) | Field tile cap |
| --- | --- | --- |
| 1 | 20 | 12 |
| 2 | 40 | 24 |
| 3 | 70 | 40 |
| 4 | 110 | 60 |
| 5 | 160 | 90 |

## Packhouse

- Single Packhouse building with Tiers (ADR 0004), built like a Factory: production queue, Slots, Tiers and Catch-up reuse the Factory rules (`PRODUCTION_TIERS`, `PRODUCTION_UPGRADE_COSTS`, `SLOT_PRICES`).
- Cost 250 Urbs, footprint 2×2, requires a road, unlocked at 20 Citizens.
- One recipe per species: 2 Crop Material → 1 packed Good (`<species>Crate`), stored in the Goods compartment.
- Packed Goods are only producible by the Packhouse; Factories never produce them and the Packhouse produces nothing else.

## Planting (sprinkling)

- The player picks one species in the Farm, then drags over Field tiles.
- Every empty Field tile touched is planted, one Seed pack each; planted tiles are ignored.
- The gesture stops when the seed stock is empty; remaining tiles stay empty.

## Growth and harvest

- Each Crop goes through four growth stages, then a ready stage. After a Harvest the tile shows an "after harvest" stage that is purely visual, then returns to an empty Field.
- Growth time depends on the species. Stages split the growth time equally.
- A ready Crop waits indefinitely, without spoiling.
- Harvest is a single drag gesture over ready Crops of any species, with no undo. If the Materials compartment (Storehouse/Silo) is full, the Crops stay ready until space is freed.
- Water Demand is per planted tile, constant from planting to the ready stage, and zero once ready.

## Seed share

- Per species and per sweep: returned Seed packs = `floor(total yield × seed share)`; the rest of the yield is stored as the Crop Material.
- `yield × seed share` is at least 1 for every species: once started, Fields sustain themselves from their own Harvests. Buying Seed packs serves to start a species or extend the planted area. Seed stock capacity and the Field cap bound the growth.

## Species and Unlocks

Eighteen species, unlocked in six tiers of three by total Citizens. All yields are Crop Materials; each has a matching packed Good unlocked at the same threshold. Values below are tuned (issue 07): net Urbs per hour of a Field tile stays within 0.6× to 2.2× of the best Factory Good of the same Unlock stage (`balance.test.ts`). Packing time and packed value are for the Packhouse recipe (2 Crop Material → 1 packed Good); packed value is the Good's `value`.

| Tier | Citizens | Species | Growth (min) | Water / tile | Yield / tile | Seed share | Seed pack (Urbs) | Packing (min) | Packed value (Urbs) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 20 | grass | 3 | 1 | 2 | 50% | 2 | 1 | 18 |
| 1 | 20 | flower | 4 | 1 | 2 | 50% | 2 | 1 | 24 |
| 1 | 20 | wheat | 5 | 1 | 3 | 40% | 3 | 1 | 20 |
| 2 | 60 | carrot | 8 | 2 | 3 | 40% | 5 | 2 | 30 |
| 2 | 60 | beet | 10 | 2 | 3 | 40% | 6 | 2 | 36 |
| 2 | 60 | lettuce | 8 | 2 | 3 | 40% | 5 | 2 | 30 |
| 3 | 120 | corn | 14 | 2 | 4 | 35% | 9 | 3 | 55 |
| 3 | 120 | rice | 16 | 4 | 5 | 35% | 11 | 3 | 65 |
| 3 | 120 | tomato | 14 | 3 | 4 | 35% | 10 | 3 | 60 |
| 4 | 250 | pumpkin | 22 | 3 | 5 | 30% | 16 | 4 | 95 |
| 4 | 250 | watermelon | 26 | 4 | 6 | 30% | 20 | 4 | 120 |
| 4 | 250 | mushroom | 20 | 2 | 4 | 30% | 14 | 4 | 85 |
| 5 | 450 | bushBerries | 32 | 3 | 6 | 25% | 28 | 5 | 170 |
| 5 | 450 | bamboo | 30 | 3 | 6 | 25% | 26 | 5 | 155 |
| 5 | 450 | cactus | 36 | 1 | 5 | 25% | 30 | 5 | 180 |
| 6 | 800 | apple | 44 | 4 | 8 | 20% | 45 | 6 | 190 |
| 6 | 800 | orange | 48 | 4 | 8 | 20% | 50 | 6 | 205 |
| 6 | 800 | palmtree | 52 | 3 | 8 | 20% | 52 | 6 | 215 |

- Species and packed Goods appear in the "next Unlock" announcement alongside other Materials and Goods.
- Crop Materials are never producible by a Workshop.

## Persistence

- Field tiles, planted Crops (species, planting time), the Farm and its seed stock are saved; a save migration is required.
- Derived data (current stage, readiness) is recomputed from the clock, as for production.

## New interactions

- A drag brush tool, a new interaction pattern: today only two-point road tools exist. It serves laying/removing Fields, planting and harvesting, with a ghost preview and touch support.

## Assets

- Crop stages, Farm and Packhouse models come from Quaternius archives in `assets/quaternus/` (FBX, converted to GLB at build time). Mapping and gaps in issue 06.

## Open points

- Real-play tuning of the species table once the loop has been played; the balance bounds are enforced by `balance.test.ts`.
