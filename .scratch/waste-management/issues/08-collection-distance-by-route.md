# 08: Waste coverage by Collection distance along the route

**What to build:** Replace the reach square of the Mound, Incinerator and Recycling plant with a Collection distance measured along the route (Road, BRT corridor, Pedestrian way, one per tile), a price that rises linearly from the tariff to twice the tariff at that distance, and nearest-by-route service. Decision record: [ADR 0058](../../../docs/adr/0058-waste-coverage-by-collection-distance-not-reach.md).

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The three Waste facilities no longer have a reach square: no `radius`, no collection contour, no tinted preview of the Homes it would reach.
- [x] Each has a Collection distance in its definition (Mound 16, Incinerator 28, Recycling plant 50), fixed per facility.
- [x] A Home is covered when a route no longer than the Collection distance joins it to a facility with capacity left; a group of adjacent Mounds is one source.
- [x] The Carrying distance and the Pedestrian surcharge (x2) keep working; the walk counts in the route length.
- [x] The usage cost per unit is tariff x (1 + route / Collection distance) x Pedestrian surcharge.
- [x] Nearest Homes by route are served first; the order Recycling plant, Incinerator, Mound is unchanged.
- [x] Causes: "out of reach" is gone; "beyond the Collection distance" is new, with the priority capacity full, beyond the Collection distance, beyond the Carrying distance, no road link.
- [x] The Codex page, the building facts and the descriptions give the Collection distance; the nuisance contours stay.
