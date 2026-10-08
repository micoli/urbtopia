# Pleasure boat

Status: ready-for-agent
Blocked by: 02
Spec: ../spec.md

## What to build

A Pleasure boat can be bought and placed on a Water tile connected to a Marina. It raises nearby Homes' Well-being and costs Urbs to run.

## Acceptance criteria

- [ ] `boats` is an optional list in `GameState`; a Boat has a family, a tile and the Marina it belongs to.
- [ ] Buying places it on a free connected Water tile of a Marina with spare capacity; 400 Urbs, unlocked at 80 Citizens.
- [ ] It is a Leisure building: Well-being for Homes in its radius with diminishing returns, never required.
- [ ] Operating cost in Urbs per cycle, one line per Marina; when it cannot be paid the Pleasure boats give no Well-being but are not removed.
- [ ] Removing a Water tile with a Boat, or one that would cut a Boat off its Marina, is refused.
- [ ] FR/EN strings; tests for placement, Well-being, operating cost and removal rules.
