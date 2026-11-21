# Architect office Tiers gate assets and plan count

Status: ready-for-agent
Spec: ../spec.md

## What to build

Five Tiers on the Architect office, upgrade costs based on the Planning office (300, 700, 1 500, 3 500 Urbs).

- Tier tables as data: unlocked bricks, roofs, dormers, chimneys, colour swatches, floors, grid size, saved plan limit.
- Tier 1: wall, window, door, flat and gable roofs, 2 floors, 5×5 cells, 8 swatches, 3 plans. Later Tiers add the rest.
- The studio greys out locked assets and names the Tier that unlocks them; saving refuses beyond the plan limit.
- A plan using locked assets (office demolished and rebuilt lower) opens read-only and cannot be built; built houses keep their design.

## Acceptance

- Tier tables live in data, covered by a test; save and load keep every plan.
