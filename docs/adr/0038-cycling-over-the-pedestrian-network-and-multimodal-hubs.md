# Cycling over the pedestrian network and multimodal hubs

Accepted. Extends ADR 0017 (building access modes) and respects ADR 0006 (independent transit networks) and ADR 0007 (capacity-aware transfers).

Bicycles have no infrastructure of their own: a Cycling trip travels over the existing Pedestrian path network (Sidewalks and Pedestrian ways) with thresholds three times those of the Walking trip, and replaces it beyond walking range. Nothing is purchased or built, so the feature costs no save state and no new tile type. A dedicated cycleway network was rejected: it would duplicate the Pedestrian path graph, its Crossings and its connectivity rules for the same result. The cost is that cyclists and pedestrians cannot be told apart in Crossing load or in a later conflict rule, which is accepted for now.

Cyclists also board BRT vehicles and Trains, not ordinary buses. A Cyclist Rider is covered by a BRT station, Railway station or Transit hub up to three times the stop radius, takes two places per line used, and uses no bus leg in its Transit itinerary.

The Transit hub is a single building that serves as a stop for each network it touches among Road, BRT corridor and Railway, and is valid as soon as it touches any of the four networks (Pedestrian ways included); without a vehicle network it is inactive. Railway becomes an Access mode next to `road` and `brt`, which ADR 0017 kept open on purpose. Transfers inside a hub need no walking distance but still count towards the two-Transfer maximum. Requiring all networks was rejected as unplayable on a real map.

Loop lines are not part of this decision: a `loop` flag on a line is cheap to change.
