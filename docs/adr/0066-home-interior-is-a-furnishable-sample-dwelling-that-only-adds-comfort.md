---
status: accepted
---

# The Home gets a Home interior: a furnishable sample dwelling that only adds Comfort

Extends [ADR 0020](0020-venue-interior-scene-and-aggregate-simulation.md) and [ADR 0064](0064-factory-floor-is-a-venue-style-interior-for-the-factory.md) to the Home. The player fits out one sample dwelling of a Home with everyday Fixtures and picks its floor. The only effect on the game is a bonus to the Well-being of the Home.

## Decisions

- **Not a Venue.** No Staff, Jobs, Takings, Visitors, Rank, events, Technician, Condition or Repair. An empty interior leaves Tax, Citizens, Demand and saves exactly as they were.
- **A sample dwelling.** The interior stands for one typical dwelling of the Home, not for each of its 6 to 400 Citizens. Its Comfort applies to the whole Home. The grid grows with the Tier of the Home, not with its Citizens.
- **Same scene, Fixtures of a new group.** The Management view and the data-driven Fixtures are those of ADR 0020. `venue` gains the value `home`. A Fixture already drawn for a Venue (chair, stove, bed, bathroom pieces, armchair) gets its own Home Fixture file with the same model: Venue catalogues and prices do not move.
- **Comfort by coverage, not by count.** Six groups, taken from the Fixture categories: sleeping (beds), washing (bathroom), eating (a table with a chair next to it), cooking (stove and sink), leisure (television, bookcase, armchair), decor (paintings, plants, lamp, coffee table, with diminishing returns). A group is covered in full or in proportion. Weights live in `assets/defs/balance/`. A table without a chair counts for nothing, like a Hotel bed without a bathroom.
- **Bonus only, capped by Tier.** Comfort adds at most +5 Well-being points at Tier 1, up to +12 at Tier 8, and never subtracts: an empty interior is not penalized. Figures are data, formulas are code (ADR 0023).
- **Floor and walls are settings of the Home, not Fixtures.** Walls are full height and always there. The floor is one of four parquets, free, without effect on Comfort. A painting is a wall-mounted Fixture placed on a wall segment, one per segment, on the two back walls.
- **A composed piece is one Fixture.** A sink on a cabinet and a cathodic television on a cabinet are single Fixtures of 1×1. Fixtures are never stacked.
- **Cost and saved state.** A one-off price in Urbs, no upkeep, a 50 % refund when a Fixture is removed. The save keeps, per Home, the Fixtures (type, position, rotation, wall face) and the parquet; an older save loads with an empty interior; a Tier upgrade keeps the Fixtures; demolishing the Home drops its interior.

## Why

Homes are the most numerous buildings and have no spatial decision left once built. The interior gives the player a calm, optional place to express taste, tied to a mechanic that already exists (Well-being), without a second economy or a requirement.

## Considered options

- **A Home as a Venue.** Rejected: it would stretch Takings and Visitors to a building that has neither.
- **A Fixture per Citizen.** Rejected: 400 beds at Tier 8.
- **Rewarding the number of objects.** Rejected: it invites spamming; coverage rewards a complete dwelling.
- **A malus for an empty interior.** Rejected: it would punish every existing save and every player who ignores the feature.
- **One multi-venue Fixture file.** Rejected: it would couple Home prices to Venue prices.

## Consequences

- The save envelope grows a per-Home interior, hence a version bump and a migration.
- The Home side panel gains a "Furnish" button, a Comfort bar and a Comfort line in the Well-being detail.
- New models to draw in Blender: sink cabinet, cathodic television cabinet, bookcase, coffee table, wall paintings; four parquets.
- Delivery in four slices: engine, Comfort, save and UI with existing models; wall-mounted Fixtures; new models; parquets.
