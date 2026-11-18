---
status: accepted
---

# A Reverser turns the Drive the other way on one tile

Extends [ADR 0085](0085-the-link-engine-is-a-module-of-its-own.md) and [ADR 0087](0087-cross-bevel-gears-and-strong-motors-serve-every-interior-that-runs-on-drive.md). A Machine such as a lathe needs a given direction, and the only ways to change the direction were a Gear (which meshes rim to rim and takes room) or a bevel gear (which also turns the line).

## Decision

- **A Reverser is a Shaft with `reverses: true`.** It has the same `shaft` role and the same sides (`front`, `back`) as the Shaft, and is declared in each of the twelve interiors that run on Drive (`<interior>Reverser`), at Tier 2.
- **It is two nodes of the Drive, like the cones of a bevel gear.** The Link engine treats a Fixture with `reverses` as a split Fixture: each side is a node of its own, and the step from one side to the other reverses the turn. The Shaft before it keeps its turn, the Shaft beyond it turns the other way, and a Motor fed back through it never jams itself.
- **Its model turns each half on its own.** The rod toward the front is `spin-y`, the one toward the back is `spin-ny`, both read from the per-side turn that `InteriorMotionLayer` already handles for cones.

## Consequences

- No new role: everything that reads `role: shaft` keeps working.
- Two Reversers in a row cancel out.
