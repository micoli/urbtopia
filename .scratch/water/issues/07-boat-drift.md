# Boat drift animation

Status: resolved
Blocked by: 03
Spec: ../spec.md

## What to build

Boats drift visually over their connected Water tiles, passing beneath Bridges.

## Acceptance criteria

- [ ] A scene layer moves each Boat over connected Water tiles; never saved, no feedback into the core (ADR 0011).
- [ ] Boats never overlap.
- [ ] Passes beneath Bridges without clipping.
- [ ] Bounded cost on a large water body.
