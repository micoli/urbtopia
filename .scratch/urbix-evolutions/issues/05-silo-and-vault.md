# Silo and Vault specialized storages

Status: resolved
Blocked by: 01

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

New unique buildings Silo (Materials compartment) and Vault (Goods compartment): road required, fixed footprint (start 2x2), Tiers raising capacity, capacity added to the Storehouse capacity per compartment, better capacity per Urb than the Storehouse. Demolition refused if stock would exceed remaining capacity. Placement, build menu, i18n and models.

## Acceptance criteria

- [ ] Only one Silo and one Vault can exist (reason like `error.storehouseExists`)
- [ ] Capacity per compartment equals the sum of existing storages; zero for a missing building
- [ ] Collect and Storage-full behavior uses the summed capacity
- [ ] Demolish refusal when stock would overflow
- [ ] Silo and Vault appear in the build flyout with FR/EN labels

## Answer

Done. `silo` and `vault` building types (2x2, 300 Urbs, road required, one each), `STORAGE_TIERS` table for the three storages (capacity per compartment is the sum over buildings). Collect works with any storage; selling any storage is refused with `error.storageInUse` when the stock would no longer fit. Build menu, panels and FR/EN labels added. Models are a placeholder (same as the Storehouse): per-building models are ticket 08.
