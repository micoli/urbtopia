# Livestock farm

Status: ready-for-agent

Decisions from the grilling session. Vocabulary in `CONTEXT.md` (Livestock farm, Animal Material, Hive, Dairy, Textile mill, Knitwear factory, Textile, Mulberry tree). Rationale in ADR-0045.

## Rules
- Livestock farm: new Production building, a Workshop (Slots, Tiers like the Mill: 5 Tiers, up to 5 then 8 Slots), needs electricity, a road and Jobs. Distinct from the Farm, which is unchanged. Build limit: 3 copies, at 300 and 800 Citizens like the Farm.
- Each species is a recipe making one Animal Material in a fixed time. Each cycle consumes one Feed from the Grain silo; without Feed the Slot waits.
  - Poultry (hen, duck): Corn. Ruminants (cow, goat, sheep, alpaca): Wheat. Silkworm: Mulberry leaves.
- Animal Materials: Hen egg, Duck egg, Milk, Goat milk, Wool, Alpaca wool, Silk, Honey. Stored in the Storehouse.
- No meat, hide or leather anywhere in the game (Animal Material rule).
- Hive: perennial placed on free owned land like an Orchard tree, no road, no water, biodiversity and Well-being only (no cooling). Produces Honey for Harvest, then starts a new cycle. Ready Honey is lost if removed.
- Mulberry tree: Orchard tree (water, hand Harvest) whose harvest is Mulberry leaves, kept in the Grain silo. Not packed, not bought by the Market.
- Dairy (Factory, Counter): Milk -> Cream, Milk -> Cheese, Goat milk -> Goat cheese.
- Textile mill (Workshop of the Mill kind, no Counter): Wool -> Textile, Alpaca wool -> Alpaca textile, Silk -> Silk fabric (a recipe has one input, so no common Textile; changed from the grilling, noted in CONTEXT.md).
- Knitwear factory (Factory, Counter): Textile -> Sweater, Gloves, Hat; Alpaca textile -> Alpaca sweater; Silk fabric -> Scarf.
- Good categories: Cream, Cheese, Goat cheese in Food; Sweater, Gloves, Hat, Alpaca sweater in Equipment; Scarf in Luxury.
- Raw Eggs, Milk, Honey are sold through the Packhouse, which gains these inputs (packed Goods in Food).
- Every Good can be stocked on a Supermarket Shelf and sold by the Market. Counter only on Dairy and Knitwear factory, listing their own Goods.
- Unlock by Citizens, per recipe: 80 Livestock farm, hen egg, Hive / 120 duck egg / 150 cow milk, Dairy / 250 wool, Textile mill / 300 goat / 400 Knitwear factory / 500 alpaca / 600 Mulberry tree, Silkworm.
- Existing recipes (Bakery, Mill) unchanged. Beeswax, candles and manure are out of scope.
- Prices, durations and values are balance, set at implementation in `assets/defs`.

## Delivery order
1. Definitions (materials, goods, schemas).
2. Livestock farm core with Feed, with tests.
3. Hive and Mulberry tree.
4. Dairy, Textile mill, Knitwear factory.
5. Packhouse, Supermarket, Market.
6. UI, i18n, guide, codex.
7. 3D models with `create-building-model`, one at a time in Blender, then registration with `add-building`.
