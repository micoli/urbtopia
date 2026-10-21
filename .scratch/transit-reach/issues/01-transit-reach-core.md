# 01: Transit reach core

**What to build:** A pure `core` computation of Transit reach, plugged into Service coverage, with the global threshold in Balance data (ADR 0023). End to end on one case: a School and a district joined by one BRT line.

**Blocked by:** none

**Status:** done

- [x] Stops A (near the facility) and B (near the Home) found with the existing stop coverage distance; only BRT station, Railway station and Transit hub qualify; ordinary Bus stops never do.
- [x] Link = Transit itinerary (at most two Transfers) with travel time (vehicle, waiting, Transfers; no walk) under the threshold.
- [x] Applies to Education, Administration, Culture, Health, Safety; Waste excluded; whole-city facilities unchanged.
- [x] Same Citizen capacity as direct reach: direct Homes first, then transit Homes from the shortest travel time; the Home crossing the capacity is still served.
- [x] Covered through Transit reach counts like direct coverage for Well-being, Tier upgrades, Needs, Sanctions, Objectives.
- [x] Independent of line load; derived, never saved, no save bump; recomputed on building, line or road change, not per tick.
- [x] Inactive line or removed station withdraws reach at the next recompute, no Adaptation period.
- [x] Threshold chosen by test: School 40 tiles from a district, one BRT line.
- [x] Unit tests: bus excluded, Waste excluded, two Transfers max, over-threshold, capacity order, BRT-only Home, line cut.
