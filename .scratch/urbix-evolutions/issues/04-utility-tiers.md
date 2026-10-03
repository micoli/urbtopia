# Power plant and Water tower Tiers

Status: resolved
Blocked by: 01

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Three Tiers for Power plant and Water tower, Capacity 12, 24, 40 (data). Utility rules unchanged: Demand can never exceed Capacity.

## Acceptance criteria

- [ ] Capacity follows Tier in the utility totals
- [ ] Selling or demolishing a plant is refused if Demand would exceed the remaining Capacity (as today)
- [ ] Utility invariant property test covers Tiers

## Answer

Done. Capacity 12/24/40 per Tier (`UTILITY_CAPACITY`), summed per building. Selling a plant is now checked against the plant actually sold (it used to remove the first plant of the type). Upgrade costs in Urbs + Goods in `UTILITY_UPGRADE_COSTS`.
