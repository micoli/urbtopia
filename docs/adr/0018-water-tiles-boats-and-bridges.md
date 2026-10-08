# Water tiles, Boats and Bridges

Accepted. Extends ADR 0014 (all buildings defined in `buildings.json`), respects ADR 0003 (versioned save envelope), ADR 0006 (independent networks) and ADR 0011 (the scene never feeds back into the core).

Water is a terrain the player lays, not a map the Seed generates. A Water tile is a 1x1 tile put on free owned land at a price in Urbs, like a Field or a Road, and removed only when nothing depends on it. Generating lakes from the Seed was rejected: it would force a map generator, make the owned Parcels uneven in value, and make unlocking gradual only by adding a separate rule.

A Boat is a persistent, saved object bought with Urbs and placed on a Water tile connected to a Marina, not a Vehicle. The glossary defines a Vehicle as a visual projection that is never saved and has no gameplay effect, while a Pleasure boat, a Casino boat and a Fishing boat each have one (Well-being, Minigames, production). Boats drift visually over connected Water tiles, but that drift is cosmetic, not saved, and never read by the core. Boats belong to one family for life. A Casino boat reuses the Casino rules and Tiers but needs no power and pays an operating cost in Urbs instead; a Fishing boat produces a Material like a Workshop and joins the existing catch-up (ADR 0002).

A Bridge is a structure of fixed length (1, 2, 3 or 5 tiles) that carries a Road over Water tiles, aligned with a Road or Crossing at each end. It joins the existing Road graph, so Commute, Congestion and Pedestrian paths use it with no new network. A Road drawn freely across water, one tile at a time, was rejected: it makes the span unbounded and hides the cost of crossing water. Boats cannot be placed on a Bridge but navigate beneath it, so the water under it stays connected.

Removing a Water tile that carries a Boat or a Bridge, a Marina that holds Boats, or a Water tile that would cut a Boat off its Marina is refused, as in ADR 0017. The state gains optional fields (`waterTiles`, `boats`, `bridges`), so saves without water need no migration. Prices and unlock thresholds are tunable in `.scratch/water/balancing.md`.
