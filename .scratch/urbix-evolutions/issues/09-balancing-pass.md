# Balancing pass for Tiers and new items

Status: resolved
Blocked by: 02, 04, 05, 06, 07

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Set Tier costs, Silo and Vault prices and capacity, durations and values of the new items, and which items get `minTier` 5. Re-check pacing targets (first Shop and sale before 5 min, first Home before 10 min) and that the 350, 600 and 1000 thresholds are reachable on the 128x128 map.

## Acceptance criteria

- [ ] Pacing tests pass
- [ ] Data-only changes
- [ ] Note the chosen numbers in the spec

## Answer

Done, with these rules encoded in `src/core/balance.test.ts`:
- Value per chain minute (Material time + Good time) never drops below that of any Good unlocked earlier. Values changed accordingly: cement 270, steel 420, jewelry 600, crystal 850. Chain rates: planks 3.5, bricks 3.8, tiles 4.4, tools 4.7, glass 5.3, circuits 5.75, cement 6.4, steel 7.0, jewelry 7.5, crystal 8.5 Urbs per minute.
- Urbs cost strictly increases at every Tier of every upgradable building.
- The last Unlock threshold (1000 Citizens) needs at most 3 Tier 8 Homes.
- Silo and Vault give more capacity per Urb than the Storehouse.
- Existing pacing tests (first sale before 5 min, first Home before 10 min) still pass: no early-game number was touched.
- Items with `minTier` 5: silicon, gold, glass, circuits, jewelry, crystal. `minTier` 4: sand, coal, cement, steel.

Not done: a playtest on a real device. The Urbs curve of the last Home Tiers (Tier 7 and 8) is set from reasoning about production rates, not measured.
