# Species catalog, Seed packs and Farm panel

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

The catalog of 18 species (growth time, water, yield, seed share, Seed pack price, Unlock threshold) and a Farm panel where the player sees the unlocked species, buys Seed packs with Urbs and reads the seed stock against its capacity.

## Acceptance criteria

- [ ] Species data lives in the core with the starting values of the spec table.
- [ ] A species is available only once its Unlock threshold is reached; species appear in the "next Unlock" announcement (`src/core/progression/unlocks.ts`).
- [ ] Buying Seed packs spends Urbs and fills the stock up to the Farm's capacity.
- [ ] The panel lets the player select the active species for planting (consumed by issue 04).
- [ ] FR/EN names for the 18 species; React component per file.
- [ ] Tests for Unlock gating, purchase and capacity.
