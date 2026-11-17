# Farm interior: an irrigation circuit and a harvest Line on one Motor

Status: resolved
Blocked by: 15
Decisions: ADR 0086.

- Fixtures of kind `farm`: Motor, Shafts, Gears, Bevels, Tank, Pumps, Pipes, Conveyors, an Intake, a Washer, a Thresher, a Grader (left-handed variants), a Harvest bin, a Sprinkler (left-handed variant), Walls.
- A Line that passes through a Washer that has Flow reaches the Harvest bin; a farmhand assigned to the bin raises the yield of every Harvest, that of the best Farm.
- A Sprinkler that Flow reaches, with an irrigator assigned, raises the Field cap of its Farm.
- Posts: farmhands and irrigators `1, 2, 3, 4, 5`; room `5, 6, 7, 8, 9`; unlocks at 60 Citizens.
- Done when: tests cover the Line, the Tank limit, the yield and the Field cap; the demonstrations, the codex and the guide describe the interior.
