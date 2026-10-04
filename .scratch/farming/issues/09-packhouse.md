# Packhouse and packed Goods

Status: resolved
Blocked by: 08
Spec: ../spec.md

## What to build

A single Packhouse building that packs Crop Materials into packed Goods, the only way to turn a Harvest into Urbs. It behaves like a Factory restricted to the 18 packing recipes.

## Acceptance criteria

- [ ] `packhouse` is a `BuildingType`; only one can be built; cost 250 Urbs, footprint 2×2, requires a road, unlocked at 20 Citizens.
- [ ] Production queue, Slots, Tiers and Catch-up reuse the Factory rules (`PRODUCTION_TIERS`, `PRODUCTION_UPGRADE_COSTS`, `SLOT_PRICES`).
- [ ] 18 packed Goods (`<species>Crate`) with recipe 2 Crop Material → 1 packed Good, packing time and value from the spec table, Unlock threshold of their species.
- [ ] `producibleItems('packhouse')` returns only packed Goods; `producibleItems('factory')` excludes them.
- [ ] Packed Goods are stored in the Goods compartment and sold in Shops and to the Market like other Goods.
- [ ] Save migration for the new building type if needed, with fixture and migration test.
- [ ] FR/EN strings; Packhouse rendered with an existing placeholder asset.
- [ ] Tests: recipe consumption, Factory/Packhouse exclusivity, sale of a packed Good.
