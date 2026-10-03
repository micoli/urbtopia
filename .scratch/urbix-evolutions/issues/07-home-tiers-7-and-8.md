# Home Tiers 7 and 8

Status: resolved
Blocked by: 01, 06

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Extend Homes to 8 Tiers (about 250 then 400 Citizens), footprints and Demand extended, upgrade costs for Tiers 7 and 8 consuming the new Goods.

## Acceptance criteria

- [ ] Upgrade to Tier 7 and 8 works with the utility rule
- [ ] Footprint growth follows the existing occupancy rules
- [ ] Citizens totals drive the new Unlocks
- [ ] Migration: existing Homes unchanged

## Answer

Done. Home Tier 7: 250 Citizens, demand 25/25, 15,000 Urbs + 4 steel + 4 cement. Tier 8: 400 Citizens, demand 40/40, 40,000 Urbs + 3 crystal + 3 jewelry. Footprint stays 2x2 for Tiers 5 to 8 (no 3x2 Kenney Home model exists), models `building-type-t` (Tier 7) and `building-type-m` (Tier 8), added to the suburban asset pack. Save validation accepts Tier 1 to 8; existing Homes are unchanged.
