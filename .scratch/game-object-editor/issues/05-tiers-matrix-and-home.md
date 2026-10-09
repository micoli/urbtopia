# Tiers matrix and Home

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 04

Introduce `tiers` with inheritance from the previous Tier and `variants`. Move `HOME_TIERS`, `HOME_FOOTPRINTS`, `HOME_UPGRADE_COSTS`, `HOME_MODELS` and `SOLAR_HOME_MODELS` (variant `solar`, roof panel included) into `home.json`; drop `MAX_HOME_TIER` and the Tier 1 duplication test. Editor: Tiers matrix (inherited greyed, override, add or remove a Tier, column drives the preview), Variants tab, read-only unlocks row.

## Comments

Delivered (2026-10-09):

- `tiersOf` and `variantsOf` (`src/core/buildings/tierSchema.ts`) build Tier schemas: Tier 1 sets every required field and has no upgrade cost, later Tiers need one; `resolveTiers` and `resolveVariant` (`tiers.ts`) apply the inheritance for the game and the editor.
- `home.json` is a `home` kind: 8 Tiers (model, footprint, Citizens, power, water, upgrade cost in Urbs and Goods) written as differences, and a `solar` variant over Tiers 1 to 4. `HOME_TIERS`, `HOME_FOOTPRINTS`, `HOME_UPGRADE_COSTS`, `MAX_HOME_TIER`, `HOME_MODELS` and `SOLAR_HOME_MODELS` are derived from it; upgrade cost Goods are checked against the Goods.
- Editor: Tiers tab (matrix of fields by Tier, inherited values greyed with override and inherit, add or remove the last Tier, the selected Tier drives the preview) and Variants tab (one matrix per variant, add and remove variants); kind switching handles `home`.
- The roof panel of Solar Homes stays in code until issue 15. No read-only unlocks row: nothing unlocks by Home Tier; it comes with production buildings.
