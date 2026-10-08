# Marina building

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

A Marina building that touches a Water tile, with Tiers that set how many Boats it holds. No Boats yet.

## Acceptance criteria

- [ ] `marina` is a building defined in `assets/buildings.json`, 600 Urbs, unlocked at 60 Citizens, Road access only.
- [ ] Placement requires at least one footprint-adjacent Water tile, with a dedicated error otherwise.
- [ ] 3 Tiers with Boat capacity (default 3 / 6 / 10), upgrade costs reuse the existing upgrade cost table.
- [ ] A helper returns the Water tiles connected (4-neighbour) to a Marina's, used by later issues.
- [ ] Removing a Marina is refused while it holds Boats (rule asserted once Boats exist).
- [ ] FR/EN strings; core logic covered by tests.
