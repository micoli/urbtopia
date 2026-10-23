# Bridges over infrastructure

Status: completed

Vocabulary and decisions: `CONTEXT.md` (Bridge, Bridge span, Bridge ramp, Carrier), ADR 0043, extends ADR 0018. Values: `balancing.md` (to write).

## Confirmed scope

- A Bridge also carries a Road or a BRT corridor (the Carrier) over Road, BRT corridor and Railway tiles. A Railway never carries one.
- Three mandatory parts: a rising Bridge ramp (1 tile), a Bridge span (1, 2, 3 or 5 tiles), a descending Bridge ramp (1 tile). Total 3, 4, 5 or 7 tiles.
- Models: `road-slant-flat-high` for the ramps, `road-bridge` for the span (Kenney city-kit-roads).
- Under the span: at least one Road, BRT or Railway tile, the rest free land. No building, Field, Pedestrian way or Roundabout, no other Bridge. Ramps stand on free land.
- The outer end of each ramp is aligned with a tile of the Carrier's network. The Bridge joins that graph and never connects to the networks beneath.
- No side exit, stop, station, Crossing or building access on the span or ramps. Sidewalks join those of the extending Road.
- Road Bridge: one Road tier for the three parts, starting at the lower tier of its two ends, upgraded as a whole, capped like a Road. BRT Bridge: no tier.
- Demolishing the last infrastructure tile under a span is refused. A network may be built under an existing span only across it.
- Price from a table per Carrier and span length (ramps included), BRT dearer by a coefficient; same unlock as the Bridge over Water (120 Citizens); usual `sellRefundRatio` refund.
- The Bridge over Water (no ramps, Bridge openings) is unchanged.
- Placement: same Bridge flyout, choice of Carrier and span length, ghost that rotates, green when valid.
- The Bridge height is rendering only: a single clearance constant; Vehicles follow the ramps; the core never reads it (ADR 0011).

## Out of scope

- Railway Bridges, stacked Bridges, stops on a Bridge, curved Bridges, mixed water-and-infrastructure spans.

## To check while implementing

- The exact penalty of today's grade Crossings (BRT priority, Pedestrian conflicts) that a Bridge removes.
- BRT ramp and span visuals (same Kenney models with the BRT surface, or variants).

## Issues

01 to 06, in order.

## Save

Optional `carrier` (`road` or `brt`) on `bridges` entries; an entry without it is a Bridge over Water. No migration (ADR 0003).
