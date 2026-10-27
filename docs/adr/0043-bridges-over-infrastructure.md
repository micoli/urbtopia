---
status: accepted
---

# Bridges over infrastructure

Extends ADR 0018 (Water tiles, Boats and Bridges), respects ADR 0006 (independent networks) and ADR 0011 (the scene never feeds back into the core).

Until now two networks could only cross on a shared tile, perpendicular and unconnected (ADR 0006), and a Road could not cross another Road or a BRT corridor another BRT corridor without a junction. A Bridge now also carries a Road or a BRT corridor over Road, BRT corridor and Railway tiles. Three choices are hard to reverse and look odd without context.

The concept stays **Bridge** rather than a new Overpass: one tool, one flyout, the same span lengths (1, 2, 3 or 5) and the same unlock. The Bridge over Water is unchanged, with no ramps and with its openings for Boats. Making Overpass a separate concept was rejected as it would duplicate placement, pricing and the Road-graph rules.

A Bridge over infrastructure always has three parts: a rising ramp, a span and a descending ramp, each ramp one tile on free land. A bare raised span was rejected: the ramps make the climb visible and let the Kenney models be used as they are: `road-slant-flat-high` for the ramps and `road-bridge` for the span. Only the Road and the BRT corridor are Carriers; a Railway is not, and passes beneath.

The Road tier of a Road Bridge is a single value for the three parts, starting at the lower tier of its ends and upgraded as a whole, so it never mixes capacities. A Bridge never connects to what lies beneath, has no stop or building access, and cannot lie over or under another Bridge. The save gains an optional `carrier` field on `bridges` entries (`road` or `brt`); an entry without it is a Bridge over Water, so no migration is needed (ADR 0003). The height of the Bridge is rendering only. Prices, unlock threshold and the BRT coefficient are tunable in `.scratch/`.

## Amendment: the Footbridge

A third Carrier, the pedestrian network, joins the Road and the BRT corridor: a **Footbridge** lets pedestrians cross a Road, BRT corridor or Railway without a Crossing, so it loads no Road tile. The concept stays **Bridge**, with the same flyout, span lengths and unlock, for the reason above: a separate concept would duplicate placement, pricing and the Bridge rules.

Its shape differs from the Road and BRT Bridges, which is why two decisions are recorded. It has no ramp: at each end a corridor and a stair of two flights at 90° stand on free land, and the footprint is 2 tiles wide and span + 2 long, with both corridors on the same side of the deck (a U, never a mirrored Z). And its walk is a chain of one node per tile in the pedestrian graph, from corridor to corridor at a cost of span + 3, rather than one long edge: scene walkers and the Street view (ADR 0046) move in straight lines between nodes, and would otherwise cut across the free lane instead of climbing the stairs. The tiles of a Footbridge give no building access.

The save adds `side` (1 or -1, which side of the deck the corridors lie on) next to `carrier: 'pedestrian'`; no migration (ADR 0003). The Road and BRT Carriers are unchanged.
