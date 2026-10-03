# Items gated by Citizens and building Tier

Status: resolved
Blocked by: 01, 02

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

Add `minTier` to every Material and Good next to `unlockCitizens`. Queueing an item requires both. The UI says which condition is missing.

## Acceptance criteria

- [ ] Queue command refused with a distinct reason for Citizens and for Tier
- [ ] Items with `minTier` 1 behave as today
- [ ] Production menu shows the missing condition
- [ ] Unlock hint (next threshold) still correct

## Answer

Done. `minTier` on every Material and Good (`minTierOf`). Starting values: silicon, glass and circuits need Tier 5 of their producing building, everything else Tier 1 (to rebalance in ticket 09). `QueueProduction` checks Citizens first (`error.itemLocked`), then Tier (`error.tierTooLow`). The production menu lists every missing condition (Citizens and/or Tier). The next-Unlock hint still follows Citizens only.
