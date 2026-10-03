# Urbtopia Evolutions

Status: ready-for-agent

Source: grilling session after the playable MVP (`.scratch/urbix-mvp/spec.md`). Vocabulary from `CONTEXT.md`. Decision recorded in ADR 0004. All numbers are starting values for a later balancing pass.

## Problem Statement

The MVP loop is complete but short: Homes stop at 160 Citizens per Home, only Homes and the Storehouse can be upgraded, and the production chain is a single step with five Materials and six Goods. After the first hours the player has nothing new to aim for and few placement or optimization choices.

## Solution

Generalize `Tier` to every upgradable building, add two specialized storages (Silo for Materials, Vault for Goods), extend the Material and Good catalog with three Materials and four Goods, and extend Homes to eight Tiers so the new items are needed. Existing saves migrate with every existing building at its current level.

## User Stories

### Tiers
1. As a player, I want to upgrade a Workshop or Factory through five Tiers, so that my production grows.
2. As a player, I want Tier 2 to make production faster, Tier 3 to raise the Slot ceiling from 5 to 8, Tier 4 to double the yield per cycle, and Tier 5 to unlock the top Materials or Goods, so that each Tier has one clear gain.
3. As a player, I want the most advanced Materials and Goods to need Tier 5 of their producing building, so that upgrading unlocks new production.
4. As a player, I want an item to require both the Citizen threshold and the building Tier, and the UI to tell me which one is missing, so that I know what to do next.
5. As a player, I want to upgrade a Power plant or Water tower through three Tiers that raise its Capacity, so that I can support larger cities without placing many plants.
6. As a player, I want Tier upgrades to cost Urbs and Goods and to apply instantly, so that growth feels immediate.
7. As a player, I want upgrades to never change a building's footprint (except Homes), so that an upgrade can never fail because of a neighbor.
8. As a player, I want the missing Urbs and Goods shown on the upgrade panel, so that I know what to produce.
9. As a player, I want to keep buying Slots with Urbs, with the Tier only raising the maximum, so that spending Urbs stays a lever.

### Storage
10. As a player, I want to build one Silo that adds capacity to Materials only, and one Vault that adds capacity to Goods only, so that I can specialize my storage.
11. As a player, I want Silo and Vault capacity to add to the Storehouse capacity of the same compartment, so that they are pure additions.
12. As a player, I want Silo and Vault to give more capacity per Urb than the Storehouse, so that specializing is worth it.
13. As a player, I want the Storehouse, Silo and Vault each to have Tiers that raise their capacity (Storehouse: 6 Tiers replacing today's five upgrades), so that storage scales.
14. As a player, I want to be refused when demolishing a storage that would leave my stock above the remaining capacity, so that I never lose items.
15. As a player, I want Silo and Vault to be limited to one each, like the Storehouse, so that the rules stay simple.

### Homes and content
16. As a player, I want Homes to reach Tier 8 (about 250 then 400 Citizens), so that the city can reach the new Citizen thresholds.
17. As a player, I want Tier 7 and 8 upgrades to consume the new Goods, so that the new chains matter.
18. As a player, I want three new Materials (sand, coal, gold) unlocked at 350, 600 and 1000 total Citizens, so that there is content past the current ceiling.
19. As a player, I want four new Goods (steel = coal + metal, cement = sand + stone, jewelry = gold + clay, crystal = sand + gold), so that the new Materials have uses.
20. As a player, I want a Good recipe to use only Materials, so that chains stay one step deep.
21. As a player, I want the Market and Shops to sell the new Goods like existing ones, with higher values, so that production pays.

### Save
22. As a player, I want my existing city to load with every building at its current level, so that nothing is lost.
23. As a player, I want my old Storehouse level preserved as its Tier, so that I keep my storage capacity.

## Implementation Decisions

- A `tier` field on every building; `storehouseLevel` removed from the state (ADR 0004).
- `BuildingType` gains `silo` and `vault`. Both are unique per city, require a road, and their footprint is fixed (starting value 2x2).
- A data table of Tier definitions per building type: cost (Urbs and Goods), effect, maximum Tier. The Home table is extended to eight Tiers, `HOME_FOOTPRINTS` included.
- Workshop and Factory effect per Tier (starting values): T2 duration x0.75, T3 Slot ceiling 8, T4 yield x2, T5 access to the items with `minTier` 5. Power plant and Water tower: Capacity 12, 24, 40.
- Each Material and Good gains a `minTier` for the producing building, next to its existing `unlockCitizens`. A queue command is refused unless both hold.
- Storage capacity per compartment = Storehouse + Silo (Materials) or Vault (Goods), each from its Tier; zero for a missing building. Existing `STORAGE_BASE_CAPACITY` and `STORAGE_UPGRADE_BONUS` become per-building Tier tables.
- A new `UpgradeBuilding` command replaces `UpgradeStorehouse` and the Home upgrade command, with one refusal-reason set (missing Urbs, missing Goods, max Tier, utility Capacity for Homes).
- Home upgrade keeps its utility rule: refused if Demand would exceed Capacity.
- New items added to the existing `MATERIALS` and `GOODS` tables; unlocks use the existing mechanism extended with the Tier check.
- Save: version bump, migration (non-Home buildings Tier 1, Storehouse Tier = `storehouseLevel + 1`, Homes unchanged), new frozen fixture.
- The core stays pure (ADR 0002). The UI reads Tier definitions as data; no rule is hard-coded in the HUD.
- i18n: FR/EN strings for new items, buildings and refusal reasons.
- 3D assets: pick Kenney models for Silo, Vault and per-Tier variants (open item).

## Testing Decisions

- Test external behavior through `dispatch` and `advance`, like the MVP: upgrade accepted or refused with each reason, production speed and yield per Tier, Slot ceiling, `minTier` gating, storage capacity sums, demolish refusal, Home Tiers 7 and 8.
- Migration test from the frozen MVP fixture, asserting Tier assignment and unchanged capacity.
- Existing property tests (utility invariant, replay and catch-up) are extended to the new Tiers and items.
- Not automatically tested: the scene and HUD, as in the MVP.

## Out of Scope

- Ore deposits or terrain-dependent resources.
- Goods made from other Goods.
- Several instances of any storage, services, transport, special buildings (still out per the MVP spec).
- Footprint changes on upgrade for non-Home buildings.
- Rebalancing existing MVP numbers beyond what the new Tiers require.

## Further Notes

- Workshop and Factory have five Tiers: four upgrades for four effects (speed, Slots, yield, exclusive items), one effect per upgrade. Exclusive items are modeled as `minTier` 5 on the top items; which items get `minTier` 5 is set in the balancing pass.
- **Open item**: Tier costs, Silo and Vault prices, new Material durations and Good values are to be set in the balancing pass; the pacing check on the first Home and first sale must still pass.
- Citizens per Home at Tiers 7 and 8 (about 250 and 400) assume the 350, 600 and 1000 thresholds are reachable on the 128x128 map; verify in the balancing pass.

## Tickets

`issues/01` to `issues/09`.

## Balancing pass (done)

See `issues/09-balancing-pass.md` for the rules and numbers, enforced by `src/core/balance.test.ts`.
