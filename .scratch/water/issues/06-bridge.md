# Bridge

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

The player can place a Bridge of 1, 2, 3 or 5 tiles that carries a Road over Water tiles.

## Acceptance criteria

- [ ] `bridges` is an optional list in `GameState`.
- [ ] Prices 150 / 300 / 450 / 800 Urbs, unlocked at 120 Citizens.
- [ ] A Bridge must be aligned with a Road or Crossing at each end and cover only Water tiles; otherwise placement is refused.
- [ ] It joins the Road graph: Commute, Congestion and Pedestrian paths use it, with a test on a Home and a workplace on opposite banks.
- [ ] No Boat can be placed on it; the Water tiles beneath stay connected for Marina connectivity.
- [ ] Removing a Water tile under a Bridge is refused.
- [ ] Rendered over the water; FR/EN strings.
