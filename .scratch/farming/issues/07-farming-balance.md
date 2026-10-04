# Farming balance and invariants

Status: ready-for-agent
Blocked by: 05
Spec: ../spec.md

## What to build

Balance checks and invariants for the whole farming loop, and tuning of the species table.

## Acceptance criteria

- [ ] No infinite loop: planting a Seed pack and replanting the returned share always yields a net loss unless extra packs are bought.
- [ ] Urbs per hour of a Crop stays in line with Workshops of the same Unlock stage.
- [ ] Tests in `balance.test.ts` and `utilityInvariant.test.ts` cover Crops.
- [ ] Open points of the spec are resolved or recorded.
