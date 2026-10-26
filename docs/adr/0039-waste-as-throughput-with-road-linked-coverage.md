---
status: accepted
---

# Waste as throughput, with road-linked coverage and a clean-to-dirty order

Waste is a Service category whose facilities (Mound, Incinerator, Recycling plant) process a daily flow of Waste against a cost in Urbs. Three choices are hard to reverse and look odd without context.

**Throughput, not filling.** A Mound has a daily capacity and never fills up. A filling landfill would add saved state, an emptying or closing action and offline catch-up, for a mechanic that can be added later on top of throughput. The player's only lever is how many Mounds, Incinerators and Recycling plants to build and where.

**Coverage needs a road link.** Every other Service category is purely geometric (a reach square and a Citizen capacity). Waste adds a connectivity condition because a truck must be able to get to the Home: a Home is covered only if a facility reaches it, has capacity left and is joined to it by the Road network. A Home reached only by Pedestrian ways is joined when its Pedestrian path network touches a linked Road within a Carrying distance of its own, and costs more to collect. Letting one Pedestrian way touching a Road cover a whole district was rejected as too easy; a collection-point building was kept for later.

**Clean to dirty, not cheap first.** Facilities are used from Recycling plant to Incinerator to Mound whatever they cost, like the allocation sequence of ADR-0005. The player shapes the mix by building, not by setting sliders. Cheapest first was rejected: it makes landfills always win.

**A BRT corridor joins the Roads it touches.** A Home built beside a BRT corridor has no Road in front of it (ADR-0017) and would never be collected, although it is a normal place to live in an ecological city. For Waste only, a BRT corridor is joined to every Road tile it touches or crosses, so a Home beside it is linked to the facility through the Roads the corridor meets. The link is a plain road link: no surcharge, unlike the Pedestrian path. A corridor that meets no Road gives no link. The networks stay independent for everything else (ADR-0006); a surcharge, to keep the Road clearly better, was rejected as one more rule to read for a case the player fixes by laying a Road.

Odor never adds up across Mounds (a Home bears the worst one), so a field of Mounds stays a placement problem and does not make a whole area uninhabitable.

The developer confirmed the complete specification in [.scratch/waste-management/spec.md](../../.scratch/waste-management/spec.md).
