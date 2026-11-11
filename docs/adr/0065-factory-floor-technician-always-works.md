---
status: accepted
---

# A hired Technician of a Factory floor always works

> Renamed: what this ADR calls the Factory floor or the Packhouse floor is now the Factory interior or the Packhouse interior ([ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md)).

Amends [ADR 0064](0064-factory-floor-is-a-venue-style-interior-for-the-factory.md), which applied the Fill rate of [ADR 0061](0061-venue-staff-counts-in-proportion-to-its-fill-rate.md) to the Technician. It does not.

**The rule.** The Technician is paid a daily wage and repairs at every hour boundary, whatever the Commute does. He is not one of the Factory's Jobs: the Jobs of a Factory are fixed by its Tier, and the Commute never looks for a Citizen to fill his post. With no Urbs left to pay the wage he does not work.

**Why not the Fill rate.** A Venue's Fill rate compares the Jobs its Staff fills with the Staff it hired. A Technician has no Job to fill, so the Fill rate would be a constant 1 for a Factory with no Staff, or would force a second, hidden source of Jobs into the Commute (and into its layout signature) for at most two posts. The cost is real and the lever it adds is small: the Technician already costs a fee and a daily wage, and he is gated by the Tier (none before Tier 3, two at Tier 5).

## Considered options

- **Count the Technician in the Factory's Jobs.** Rejected: it changes the Jobs, the Commute and the Unemployment of every Factory in every save for a feature most players never open.
- **A flat threshold (works only if the city has a free Citizen).** Rejected: a cliff the player cannot read, which ADR 0061 already refused.

## Consequences

- A Factory far from any Home keeps a working Technician; his wage is the only price. Balancing may ask for the Fill rate later, in which case the Technician becomes a Job of the Factory.
- ADR 0064 no longer says that the Fill rate applies to the Technician.
