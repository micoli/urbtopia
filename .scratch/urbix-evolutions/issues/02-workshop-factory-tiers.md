# Workshop and Factory Tiers (5)

Status: resolved
Blocked by: 01

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Five Tiers for Workshop and Factory: T2 duration x0.75, T3 Slot ceiling 5 to 8 (Urbs purchase of Slots kept), T4 yield x2 per cycle, T5 reserved for `minTier` 5 items (ticket 03). Costs in Urbs and Goods as data. Footprint never changes.

## Acceptance criteria

- [ ] Production duration, yield and Slot ceiling follow the Tier table in `advance` and catch-up
- [ ] Yield x2 yields the doubled quantity into the Storehouse and respects capacity
- [ ] Slot purchase refuses above the Tier's ceiling
- [ ] Replay and catch-up property tests extended to Tiers

## Answer

Done. Tier tables in `economy.ts` (`PRODUCTION_TIERS`, `PRODUCTION_UPGRADE_COSTS`), read through `productionTierOf`. Duration factor and yield are frozen into each queue entry at queue time (new `quantity` field, save version 3 with migration and `save-v3.json` fixture), so an upgrade never rewrites running work. Collect needs room for the whole quantity. Slot ceiling 5/5/8/8/8, prices for Slots 6 to 8 added. Tier 5 has no effect yet: it waits for `minTier` gating (ticket 03).
