# Houses of plans look like the Homes of the game

Status: ready-for-agent
Spec: ../spec.md

## What to build

Align the 3D house of a plan (`buildHouse`) on the Homes of the `urbtopia` style (Mansard, Brownstone, Colonial).

- Palette material in flat shading instead of one coloured material per plan; wall, roof and slot colours resolve to palette cells.
- Glass on the `glass` cell, so the lit-windows shader (ADR 0050) applies; no transparent glass.
- Measure on the reference Homes the floor height, wall thickness, roof pitch and eaves, and set the studio constants to match.
- The footprint is settled: 4 cells per tile, at most 2×2 tiles (`CELLS_PER_TILE = 4`, `GAME_CELL_SIZE = 0.25`).

## Acceptance

- A plan house and a classic Home of the same footprint and floors, side by side, day and night, differ only in design.
- Equal plans still share one cached model.
