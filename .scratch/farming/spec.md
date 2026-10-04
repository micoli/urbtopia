# Farming

Status: ready-for-human
Completion: pending

## Confirmed scope

- The player builds a Farm, lays Field tiles on free owned land, plants Crops with Seed packs and harvests them.
- The Farm holds a seed stock of its own; the Storehouse and Silo never hold Seed packs.
- Seed packs are bought with Urbs. Each Crop species is made available by an Unlock.
- A Harvest yields a Material, sold or stored like any other Material. A species-specific share of the yield is converted automatically into Seed packs instead of being sold.
- Water: a planted Field tile adds water Demand until its Crop is ready. Planting is refused when the extra Demand would exceed water Capacity. A Crop already planted is never penalised afterwards.
- Growth runs on game time and is applied by Catch-up (up to 48 game hours), like production.

## Field tiles

- Laid and removed by dragging a brush over free tiles of owned Parcels (no building, road or nature element).
- Cost in Urbs per tile. Removing a planted Field loses its Crop with no refund.
- The number of Field tiles is capped by the Farm's Tier.

## Farm

- Single Farm building with Tiers (ADR 0004). Tier raises the seed stock capacity and the Field tile cap.
- One Farm per city; its seed stock is shared by every Field of the city, with no range.
- When the seed stock is full, the surplus of Seed packs from a Harvest is lost; the sold share is unchanged.

## Planting (sprinkling)

- The player picks one species in the Farm, then drags over Field tiles.
- Every empty Field tile touched is planted, one Seed pack each; planted tiles are ignored.
- The gesture stops when the seed stock is empty; remaining tiles stay empty.

## Growth and harvest

- Each Crop goes through four growth stages, then a ready stage. After a Harvest the tile shows an "after harvest" stage that is purely visual, then returns to an empty Field.
- Growth time depends on the species. Stages split the growth time equally.
- A ready Crop waits indefinitely, without spoiling.
- Harvest is a single drag gesture over ready Crops of any species. If the Storehouse/Silo (or Vault) is full, the Crops stay ready until space is freed.
- Water Demand is per planted tile, constant from planting to the ready stage, and zero once ready.

## Species and Unlocks

Eighteen species, unlocked in six tiers of three by total Citizens. All yields are Materials. Values below are starting points to tune.

| Tier | Citizens | Species | Growth (min) | Water / tile | Yield / tile | Seed share | Seed pack (Urbs) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 20 | grass | 3 | 1 | 2 | 50% | 2 |
| 1 | 20 | flower | 4 | 1 | 2 | 50% | 2 |
| 1 | 20 | wheat | 5 | 1 | 3 | 40% | 3 |
| 2 | 60 | carrot | 8 | 2 | 3 | 40% | 5 |
| 2 | 60 | beet | 10 | 2 | 3 | 40% | 6 |
| 2 | 60 | lettuce | 8 | 2 | 3 | 40% | 5 |
| 3 | 120 | corn | 14 | 2 | 4 | 35% | 9 |
| 3 | 120 | rice | 16 | 4 | 5 | 35% | 11 |
| 3 | 120 | tomato | 14 | 3 | 4 | 35% | 10 |
| 4 | 250 | pumpkin | 22 | 3 | 5 | 30% | 16 |
| 4 | 250 | watermelon | 26 | 4 | 6 | 30% | 20 |
| 4 | 250 | mushroom | 20 | 2 | 4 | 30% | 14 |
| 5 | 450 | bushBerries | 32 | 3 | 6 | 25% | 28 |
| 5 | 450 | bamboo | 30 | 3 | 6 | 25% | 26 |
| 5 | 450 | cactus | 36 | 1 | 5 | 25% | 30 |
| 6 | 800 | apple | 44 | 4 | 8 | 20% | 45 |
| 6 | 800 | orange | 48 | 4 | 8 | 20% | 50 |
| 6 | 800 | palmtree | 52 | 3 | 8 | 20% | 52 |

## Persistence

- Field tiles, planted Crops (species, planting time), the Farm and its seed stock are saved; a save migration is required.
- Derived data (current stage, readiness) is recomputed from the clock, as for production.

## New interactions

- A drag brush tool, a new interaction pattern: today only two-point road tools exist. It serves laying/removing Fields, planting and harvesting, with a ghost preview and touch support.

## Open points

- Material values and Urbs balance of the species table.
- Whether the Codex lists Crops and how the Farm's UI exposes species and seed stock.
- Visual assets for the stages of each species (four growth stages, ready, after harvest).
