---
status: accepted
---

# An interior role carries its own part of the effect, in proportion to its Fill rate

Extends [ADR 0061](0061-venue-staff-counts-in-proportion-to-its-fill-rate.md) and [ADR 0065](0065-factory-floor-technician-always-works.md) to the Production interiors and the Service interiors of [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md).

## Decisions

- **Roles.** Mill: miller, technician. Bakery: baker, seller, technician. Dairy: cheesemaker, cream maker, technician. Storehouse: stocker, technician. School: teacher. Library: librarian. Hospital: nurse, doctor, surgeon. Each costs a one-off hiring fee of five days of wages, then a daily wage in Urbs, and its posts follow the Tier (at the Hospital, nurse from Tier 1, doctor from Tier 2, surgeon from Tier 3).
- **One part per role.** The effect of an interior is split into parts, each carried by one role and counted in proportion to that role's own Fill rate: miller (speed), baker (speed), seller (Counter sales rate), cheesemaker (Cheese yield), cream maker (Cream yield), stocker (capacity), teacher, librarian, and nurse, doctor, surgeon (three parts of the Well-being bonus). Paying one role never gives the parts of the others.
- **The share of a part.** A role delivers the hired Staff that come to work, over its posts at the Tier, capped at 1: `min(1, hired × Fill rate / posts)`. The Fill rate of an interior is the share of the Jobs of its building that Citizens fill on the Commute, the hired interior Staff being Jobs of that building.
- **A bonus, not a malus.** An unfilled part adds nothing, but never takes away what the building did before: a Bakery with no seller sells as it always did.
- **The Technician is unchanged.** Where Fixtures wear, it repairs, always works and is not subject to the Fill rate ([ADR 0065](0065-factory-floor-technician-always-works.md)). Service interiors have none.

## Why

Staff for every interior makes the Fixtures a potential that people realise, and one role per part makes each hire a reason to exist. The no-malus rule keeps the "empty interior changes nothing" invariant true for the existing saves.

## Considered options

- **One role for the whole effect.** Rejected: a single hire would unlock everything.
- **The Fill rate not applied to the new roles.** Rejected: it would make a role a switch, against the aggregate model of the Venues.

## Consequences

- The `StaffRole` type grows the roles above, each with a wage in the balance data.
- Their posts and parts live in `assets/defs/balance/`, so they are tuned without code.
