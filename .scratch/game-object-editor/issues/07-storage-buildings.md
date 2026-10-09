# Storage buildings

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

Storehouse, Silo, Vault, Grain silo: `STORAGE_TIERS` unfolded from `base + perTier` into explicit capacities per compartment and Tier, upgrade costs, `STOREHOUSE_MODELS`, `GRAIN_SILO_MODELS`. Values must equal today's formula results (test).

## Comments

Delivered (2026-10-09):

- Storehouse, Silo, Vault and Grain silo are a `storage` kind with 6 explicit Tiers (materials, goods and crops capacity, model, footprint, upgrade cost); `StorageType` is generated from them.
- `STORAGE_TIERS` and its base plus step rule are replaced by `storageTierOf(type, tier)` and `STORAGE_TYPES`; `storageTiers.test.ts` pins the unfolded values to the former rule. The Storehouse and Grain silo models per Tier come from their files.
