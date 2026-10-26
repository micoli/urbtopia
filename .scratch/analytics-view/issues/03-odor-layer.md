# Odor Layer

Status: resolved
Spec: ../spec.md
Blocked by: 02

## What to build

Odor radius Data layer as a tile field from the Mounds' Odor radius, never summed (worst Mound wins).

## Acceptance criteria

- [ ] `odorField(state)` pure and tested: two overlapping Mounds give the worse malus, not the sum.
- [ ] Value at a Home's tile equals its odor penalty in `homeBenefits`.
- [ ] Empty (with legend) when no Mound exists.
