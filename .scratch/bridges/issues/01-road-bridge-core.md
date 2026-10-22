# Core: place a Road Bridge over infrastructure

Status: ready-for-agent
Spec: ../spec.md

## What to build

The player can place a Road Bridge (ramp, span 1/2/3/5, ramp) over Road, BRT corridor and Railway tiles.

## Acceptance criteria

- [ ] `bridges` entries gain an optional `carrier`; absent means over Water, with a persistence test on an old save.
- [ ] Placement refused unless the span covers at least one infrastructure tile, the rest free land, the ramps free land, both outer ends aligned with a Road; no building, Field, Pedestrian way, Roundabout or other Bridge underneath.
- [ ] Joins the Road graph; a Home and a workplace on either side of a Railway commute across it; it does not connect to the network beneath.
- [ ] No side exit, stop, Crossing or building access on span or ramps.
- [ ] Price table, unlock at 120 Citizens, refund on removal.
