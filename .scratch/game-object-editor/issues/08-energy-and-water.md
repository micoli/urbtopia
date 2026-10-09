# Energy and water buildings

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

Power plant, Coal Power plant, Water tower, Solar installation, Neighborhood battery, Backup Power plant: `UTILITY_CAPACITY`, `COAL_CAPACITY`, `COAL_UPGRADE_COSTS`, `UTILITY_UPGRADE_COSTS`, `COAL_MODELS` and the energy constants per building.

## Comments

Delivered (2026-10-09):

- Power plant, Water tower and Coal Power plant are a `utility` kind (Tiers: capacity, model, footprint, upgrade cost); `UTILITY_CAPACITY` and `COAL_CAPACITY` are derived from them and the chimney models per Tier come from the Coal plant file.
- The Solar installation (`solar`: output, formerly a literal in `energy.ts`), the Neighborhood battery (`battery`: storage, rate, radius) and the Backup Power plant (`backup`: capacity, cost per unit) carry their own figures; `ECOLOGY` reads them from the definitions.
- The editor creates these kinds with their required fields.
