---
status: accepted
---

# Waste coverage by Collection distance along the route, not by reach

Supersedes the "Coverage needs a road link" choice of [ADR 0039](0039-waste-as-throughput-with-road-linked-coverage.md): a Home no longer has to lie inside a Waste facility's reach square. The other choices of ADR 0039 stand.

A truck travels, it does not fly. A Home is a candidate for a Waste facility when the Road network joins them (a BRT corridor joins the Roads it touches or crosses, a Pedestrian-only Home is joined through a Road within the Carrying distance), and the length of that route sets two things.

**A Collection distance per facility.** Each Waste facility has a longest route, in tiles, from the facility to a Home: Mound 16, Incinerator 28, Recycling plant 50 at the start, fixed per facility and not per Tier. The route counts one per tile of Road, BRT corridor or Pedestrian way, and starts at the facility's own Road (for a group of adjacent Mounds, from every Mound of the group). A Home farther than that is not covered by that facility and says so ("beyond the Collection distance"). Citizens served stay limited by the Tier's capacity, as before.

**A price that grows with the route.** The usage cost per unit is the facility's tariff times a factor that rises linearly from 1 next to the facility to 2 at its Collection distance, then times the existing Pedestrian surcharge. Nearest Homes are served first, by route length. The order of use stays Recycling plant, Incinerator, Mound whatever the price, so the distance changes what a Home costs and where it can be served, never which kind of facility comes first.

Why: with a reach square, a Home could be next to a facility, joined by a Road, and still uncovered because of a corner of the square, while a Home far along a straight Road was not helped by it. The route is what a truck drives, and it makes a long Road a real cost.

Rejected: a Road link alone with no distance limit (one Recycling plant would serve the whole connected city, so placement would only be about nuisances); Manhattan distance for the limit (ignores detours the player builds).

No save migration and no new Adaptation period: coverage is derived, and Homes may become covered or uncovered at the next evaluation.
