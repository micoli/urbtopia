# Core Pedestrian way construction, upgrades and removal

Status: claimed
Blocked by: none

## What to build

Add optional Pedestrian way tile state and deterministic core commands to build, upgrade and remove contiguous paths. A newly built tile costs 90% of one Road tile; an upgrade costs 90% of the corresponding Road tier upgrade.

## Acceptance criteria

- [x] Existing saves without a `pedestrianWays` field load unchanged.
- [x] Build command follows the same owned-parcel, occupancy and Urbs rules as Road construction; existing Pedestrian way tiles cost nothing again.
- [x] Pedestrian ways cannot overlap Roads, buildings, fields, water, BRT or rail tiles.
- [x] Pedestrian ways can connect to each other and terminate at a Road sidewalk; no adjacency-only Road connection is implied.
- [x] Upgrade command advances selected Pedestrian way tiles through the same tiers as Roads at 90% of each matching Road upgrade cost.
- [x] Removal supports tile and dragged-path commands, with removed tiles preserved by the existing undo flow.
- [ ] Core tests cover costs, invalid placement, affordability, upgrades, removal and deterministic outcomes.

## Comments
