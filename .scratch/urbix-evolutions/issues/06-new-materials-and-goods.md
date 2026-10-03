# Sand, coal, gold and four new Goods

Status: resolved
Blocked by: 03

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Add Materials sand, coal, gold (unlock 350, 600, 1000 Citizens) and Goods steel (coal + metal), cement (sand + stone), jewelry (gold + clay), crystal (sand + gold). Durations and values as starting data. Goods recipes use Materials only. Sellable in Shops and to the Market.

## Acceptance criteria

- [ ] New items in the production menus, unlocked by Citizens and `minTier`
- [ ] Recipes consume Materials only (test enforces it)
- [ ] Shop and Market sales work for new Goods
- [ ] FR/EN labels and icons/models

## Answer

Done. Materials sand (24 min, 350 Citizens, Tier 4), coal (32 min, 600, Tier 4), gold (48 min, 1000, Tier 5). Goods steel (coal + metal, 20 min, value 320), cement (sand + 2 stone, 14 min, 150), jewelry (gold + 2 clay, 24 min, 520), crystal (sand + gold, 28 min, 640). Recipes use Materials only (tested). FR/EN names added; no icons exist in the UI for items. All numbers are starting values for ticket 09.
