# Core: Footbridge carrier, footprint, placement rules, persistence

Status: resolved
Spec: ../spec.md

## What to build

The player can place a Footbridge (U shape: corridor, 90° staircase, deck of 1/2/3/5 tiles, staircase, corridor) over Road, BRT corridor and Railway tiles. Footprint is 2 wide and `span + 2` long.

## Acceptance criteria

- [x] `Bridge.carrier` accepts `'pedestrian'`; `src/persistence/validate.ts` and Cloud save validation accept it; an old save loads unchanged (persistence test).
- [x] Width-aware footprint helpers for this Carrier (tiles, corridors, deck rows, 4 rotations, no mirror); existing Carriers stay 1 wide.
- [x] Placement refused unless: at least one Road/BRT/Railway tile under the deck rows, the rest free land; end rows on free land; no building, Field, Pedestrian way, Roundabout or other Bridge underneath; each corridor touches a Pedestrian way or a free Sidewalk side; both ends connected. Each refusal has a distinct reason.
- [x] Demolishing the last infrastructure tile under a deck is refused.
- [x] Removal refunds at `sellRefundRatio`.

## Blocked by

None.
