# Farm building

Status: resolved
Blocked by: none
Spec: ../spec.md

## What to build

A single Farm building, buildable from the build menu, with Tiers (ADR 0004) and an empty seed stock in game state. It is the entry point of cultivation and does nothing else yet.

## Acceptance criteria

- [ ] `farm` is a `BuildingType`; only one can be built, placement follows the usual Parcel rules.
- [ ] Building spec: cost 200 Urbs, footprint 2×2, requires a road.
- [ ] Tier data follows the spec's Farm table (seed stock 20/40/70/110/160, Field cap 12/24/40/60/90); upgrade costs reuse `PRODUCTION_UPGRADE_COSTS`.
- [ ] Unlocked at 20 Citizens; it appears in the build menu only then. Existing tutorial steps are unchanged and `tutorial.test.ts` still passes.
- [ ] `GameState` holds the seed stock (species to count); saves migrate to the next version with a fixture and migration test.
- [ ] FR/EN strings; Farm model rendered with an existing placeholder asset if needed.
- [ ] Core logic covered by tests in `src/core`.
