# Water

Status: completed

Vocabulary and decisions: `CONTEXT.md` (Water tile, Boat, Pleasure boat, Casino boat, Fishing boat, Marina, Bridge, Bridge opening, Fish, Canned fish), ADR 0018 and ADR 0019. Values: `balancing.md`.

## Confirmed scope

- The player lays Water tiles (1x1) on free owned land, by dragging a brush like Field tiles. Removal is free and refused while something depends on the tile.
- A Marina (3 Tiers) touches a Water tile and is reached by Road. Boats are placed on Water tiles connected to a Marina's; its Tier sets Boat capacity.
- Pleasure boat: Leisure building, Well-being for nearby Homes, operating cost in Urbs.
- Casino boat: a Casino (same Minigames and Tiers), no power, operating cost in Urbs, never shed on a power shortage.
- Fishing boat: produces Fish like a Workshop; a Factory makes Canned fish. Slots come from the Marina Tier.
- Bridge (1, 2, 3 or 5 tiles): carries a Road over Water tiles, joins the Road graph, Boats navigate beneath it.
- Bridge opening: the Bridge lifts in two leaves, each hinged on its bank, when a Boat passes. Traffic and service vehicles stop at its gates. In the core it lowers the Bridge capacity by a closed fraction that grows with the Boats on the same water (ADR 0019); in the scene it is a projection.
- Boats drift visually over connected Water tiles and wait for a closed Bridge; the drift is never saved and never read by the core.

## Out of scope

- Seed-generated water, docks or piers, a stock of fish tied to the size of the water.

## Issues

01 to 07 build the feature, 08 and 09 add the drawbridges. All are resolved.

## Save

Optional state fields `waterTiles`, `boats`, `bridges`: saves without water need no migration (ADR 0003).
