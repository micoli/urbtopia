# Hex grid and score

Status: resolved
Blocked by: none
Spec: ../spec.md

## What to build

The pure core of the District plan: a hexagonal grid in axial coordinates and the scoring of placed Hexes. No UI, no save, no building. It lives in its own module and shares nothing with the square grid of the city.

## Acceptance criteria

- [ ] Axial coordinates, the six neighbours, the distance and the cells of a board of radius 4.
- [ ] A Hex has six edges using two Hex categories, and turns in steps of 60°.
- [ ] A placement is valid only on a free cell that touches a placed Hex, within the radius.
- [ ] The score of a board is the sum over pairs of touching edges of the pair table; an edge that touches nothing counts for nothing.
- [ ] The pair table is read from `assets/defs/balance/districtPlan.json` and its schema; no value in code.
- [ ] Table tests over every pair, over rotations, and over validity at the edge of the board.
