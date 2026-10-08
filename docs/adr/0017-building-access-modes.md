# Building access modes

Accepted. Extends ADR 0014 (all buildings defined in `buildings.json`) and respects ADR 0006 (independent transit networks).

A building no longer needs a Road in front of it by definition. Each entry of `assets/buildings.json` declares `accessModes`, the networks it can be reached from, and a position is valid when any accepted mode has a tile in front of the building. Homes, Leisure buildings, Shops and Public facilities accept `road` and `brt`; every other building keeps the road requirement. The field replaces a second boolean next to `requiresRoad`, so rail or another network can be added later without a new flag.

A building reached only by BRT has no car Commute and no Pedestrian path, since both rely on Road tiles and their implicit sidewalks. It lives off public transport: a BRT-only Home depends on the BRT stations that cover it and is flagged disconnected without one, and BRT-only workplaces are staffed by Riders. When a building touches both networks, the road remains the primary access and decides the front direction; the BRT is an alternative, never a replacement. Removing the last access of a building, whichever mode, is refused.

Networks stay independent, as in ADR 0006: a Road crossing a BRT corridor still does not connect them. Service vehicles are a visual projection with no gameplay effect and follow the same rule, so they drive on the network of their facility and never switch. The alternative of giving the BRT sidewalks and a car-compatible lane was rejected: it would turn the dedicated corridor into an ordinary Road variant, which ADR 0006 sets aside. The cost is that a BRT-only district is entirely driven by station coverage and BRT capacity, which makes its balance a matter for the balancing pass rather than a rule exception.

The field lives in game data, not in the saved state, so no save migration is needed (ADR 0003).
