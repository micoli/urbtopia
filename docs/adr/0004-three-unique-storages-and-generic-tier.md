# Three unique storages and a Tier on every upgradable building

Partly superseded: storages are no longer unique. Each building now has a Build limit that rises with the Citizens, an Escalating price per copy, and capacities that add up across copies (see `CONTEXT.md`). The Silo is now the Material depot, id `materialDepot`; saves are migrated at version 13. The per-building `tier` decision still stands.

Storage is split into three unique buildings (Storehouse, Silo, Vault) whose capacities add up per compartment, and the upgrade level moves from a global `storehouseLevel` in the state to a `tier` carried by each building. `Tier` becomes the single upgrade concept for Home, Workshop, Factory, Storehouse, Silo, Vault, Power plant and Water tower.

## Why

- The MVP storage is a singleton with a global level; adding specialized storage on top would multiply special cases (`siloLevel`, `vaultLevel`, ...). A per-building `tier` removes them and gives the UI one upgrade flow.
- Capped at one instance per storage type, there is no allocation logic between several instances: capacity per compartment is a sum of at most three terms.
- Alternatives rejected: several identical Storehouses (cumulative, no reason to specialize), free-count specialized storages (needs allocation and placement balancing), a separate "upgrade level" term for non-Home buildings (two concepts for the same idea).

## Consequences

- State shape changes: `storehouseLevel` is removed and every building has a `tier` (existing non-Home buildings become Tier 1, the existing Storehouse takes `storehouseLevel + 1`). Requires a save version bump, a migration and a frozen fixture (ADR 0003).
- Demolishing a storage that still holds items beyond the remaining capacity must be refused, as the Storehouse is today.
- Per-Tier effects are data tables; the balancing pass changes data only. Those tables now live in the Game object files ([ADR 0023](0023-tier-values-and-balancing-as-data-formulas-in-code.md)).
