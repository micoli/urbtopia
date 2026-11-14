---
status: accepted
---

# The Recycling interior moves the plant's capacity and Collection distance, and its Fixtures wear

Extends [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md), [ADR 0068](0068-packhouse-floor-reuses-the-factory-floor-engine-with-a-line-network.md) and [ADR 0058](0058-waste-coverage-by-collection-distance-not-reach.md). It departs from ADR 0070 on three points, on purpose.

## Decisions

- **A Service interior that departs from the family.** The Recycling plant is a Waste facility, so its interior is a Service interior. ADR 0070 says a Service interior never changes reach or capacity, does not wear and has no Technician. The Recycling interior changes the Collection distance and the Waste capacity, its Fixtures wear and a Technician repairs them. The other Service interiors (School, Library, Hospital) keep the rule.
- **Same engine as the Packhouse.** Drive (Motor, Gear, Shaft, Bevel) only, no Flow. Waste travels on a **Recycling line**: Intake, Sorter, a Recycler, a Collection exit, joined by Conveyors. Intake, Sorter and the three Recyclers (Shredder, Smelting furnace, Glass crusher) each come in a right-handed and a left-handed version for the side the Drive enters.
- **Only a complete line counts.** Intake, Sorter, a Recycler and a Collection exit unbroken in that order, every Machine driven and not broken down. A break or a broken Machine unlinks everything downstream.
- **Capacity.** The Tier's capacity, plus 50 per Collection exit on a complete line, plus 200 when the three kinds of Recycler are each on a complete line.
- **Collection distance.** The base distance, plus 1.5 tiles per Recycler on a complete line.
- **Caps by Tier.** Collection exits 1/2/3/4, Sorters 1/2/3/4, Recyclers 2/3/4/6.
- **Staff.** One role, the Technician, 1/2/3/4 posts by Tier, always working while its wage can be paid, paid by the city ([ADR 0072](0072-public-facilities-pay-the-wages-of-their-service-interior-staff.md)). No Operator, no assignment, no Restocker, Scanner or Strapper.
- **Waste is not typed.** The three Recyclers differ only by their model and by the bonus for having all three.
- **Power.** Motors draw electricity as in a Factory; a Motor short of power leaves its Machines unlinked. The Waste tariff and the base power of the plant do not change.
- **Unlock and flag.** The interior opens as soon as the plant can be built, with no flag of its own.
- **Saved state.** The Fixtures under `interior`; Links, bonuses and Waste on the line are never saved. An older plant loads empty.

## Why

The request was to make the layout of the room the lever for the plant's capacity and reach. That cannot be done without breaking the Service rule, so the break is named here rather than hidden in code. Reusing the Packhouse's Line and Drive keeps the cost to Fixtures and a bonus function.

## Considered options

- **Classify it as a Production interior.** Rejected: the plant is not a Production building and its bonus acts on Waste, not on Goods.
- **Type the Waste per Recycler.** Rejected: the Waste model has no types, and it would need a new balance for no new choice.
- **Operators assigned to Machines.** Rejected: one Technician is enough; the layout is the decision.

## Consequences

- ADR 0070 gains a remark that this interior is an exception.
- Fixtures drawn, in Blender and in English: Intake, Sorter, Shredder, Smelting furnace and Glass crusher (each left and right), and the Collection exit. The nine Conveyors of the Packhouse, the Drive Fixtures (Motor, Gear, Shaft, Bevel, Bevel-tee) and the walls, partitions and floor are reused as they are. The `recycling-truck` already exists.
