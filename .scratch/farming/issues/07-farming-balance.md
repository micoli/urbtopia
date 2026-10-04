# Farming balance and invariants

Status: resolved
Blocked by: 05, 09
Spec: ../spec.md

## What to build

Balance checks and invariants for the whole farming loop (Seed pack → Crop → Crop Material → packed Good), and tuning of the species table.

## Acceptance criteria

- [ ] Self-sustaining Fields: for every species `yield × seed share ≥ 1`, so a planted area can be replanted from its own Harvest without buying Seed packs; growth beyond that is bounded by the seed stock capacity and the Field cap.
- [ ] Net Urbs per hour of a Field tile (packed value minus Seed pack cost and Field cost amortised) stays in line with a Factory Good of the same Unlock stage.
- [ ] Tests in `src/core/engine/balance.test.ts` and `src/core/environment/utilityInvariant.test.ts` cover Crops and packed Goods.
- [ ] Spec table updated with tuned values; remaining open points recorded in the spec.
