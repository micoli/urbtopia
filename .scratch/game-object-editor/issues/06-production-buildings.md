# Production buildings

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

Workshop, Factory, Packhouse, Farm and Shop: `PRODUCTION_TIERS`, `PRODUCTION_UPGRADE_COSTS`, `FARM_TIERS`, `FACTORY_MODELS` and the Shop constants move into their files. Kinds and editor forms.

## Comments

Delivered (2026-10-09):

- Workshop, Factory and Packhouse are a `production` kind (Tiers: model, footprint, duration factor, max Slots, yield, upgrade cost) and the Farm a `farm` kind (seed capacity, Field cap); each building now carries its own Tiers, the Factory its model per Tier.
- The game reads any building with Tiers generically: `maxTierOf` and `upgradeCostOf` from its Tiers, `productionTierOf` and `farmTier` by building type, footprint and model per Tier in `footprintOf` and `modelOf`; resolved Tiers are cached. `PRODUCTION_UPGRADE_COSTS` follows the Workshop for the Marina until issue 12.
- Editor: the building kinds come from the schema; new and converted buildings of a kind with Tiers start with a Tier 1; the Tiers matrix shows a read-only Unlocks row (Materials for the Workshop, Goods for the Factory, by their minimum Tier).
- The Shop has no Tiers: its stack size and sale interval move to the Balance files in issue 14.
