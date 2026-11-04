# Underground walkway and Pedestrian access

Status: resolved
Spec: ../spec.md
Blocked by: 01, 02

## What to build

The player builds Underground walkways on Level -1 and Pedestrian accesses on the Surface; Walking and Cycling trips use them.

## Acceptance criteria

- [x] Walkways placeable on any tile of Level -1, under Buildings, Roads, Bridges and Water.
- [x] A Pedestrian access needs a free Surface tile touching a Sidewalk or a Pedestrian way; inactive without a walkway below.
- [x] Walkways and active accesses join the pedestrian graph; a Walking or Cycling trip uses them and loads no Crossing.
- [x] A walkway with no access is marked disconnected; removing an access keeps the walkway.
- [x] Walkers drawn on Level -1 only; Street view unchanged.
- [x] Price from `balancing.md`, unlock after the Footbridge, refund on removal.
