# Tier on every building and save migration

Status: resolved
Blocked by: 

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Add a `tier` field to every building and remove the global `storehouseLevel`. Introduce a data table of Tier definitions per building type (cost in Urbs and Goods, effect, maximum Tier) and a single `UpgradeBuilding` command replacing `UpgradeStorehouse` and the Home upgrade command, with one set of refusal reasons. Storehouse moves to 6 Tiers (today's five upgrades plus base). Bump the save version, add the migration (non-Home buildings Tier 1, Storehouse Tier = `storehouseLevel + 1`) and a frozen fixture.

## Acceptance criteria

- [ ] Every building carries a `tier`; `storehouseLevel` no longer exists in the state
- [ ] `UpgradeBuilding` upgrades Home and Storehouse with the same capacity and cost behavior as the MVP, instantly
- [ ] Refusals: missing Urbs, missing Goods, max Tier, utility Capacity (Homes)
- [ ] Migration test from the MVP fixture keeps storage capacity and Home Tiers identical
- [ ] Newer-than-app saves are still refused (ADR 0003)
- [ ] Existing core tests pass; UI upgrade panel works for Home and Storehouse

## Answer

Done. `tier` is on every building (Tier 1 by default); `storehouseLevel` removed. `src/core/tiers.ts` holds the upgrade cost tables and `maxTierOf`. `UpgradeBuilding` replaces `UpgradeHome` and `UpgradeStorehouse` (event `BuildingUpgraded`, errors unified under `error.maxTier`). Save version 2 with migration and `save-v2.json` fixture. 372 tests, typecheck and lint pass.
