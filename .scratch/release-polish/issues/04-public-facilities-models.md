# Replace the Public facility models

Status: in progress
Blocked by: 01, 02, 03
Spec: ../spec.md

## Acceptance criteria

- [ ] Every Public facility (Education, Administration, Culture, Health, Safety) and Worship place is rebuilt with the shared kit, keeping Model id and footprint.
- [ ] The poly.pizza models they use (temples, pagodas, and so on) are removed and their license entries leave the credits when none remain.
- [ ] Each Tier of a facility stays visually distinct.
- [ ] Baselines updated and reviewed.

## Progress

Status check (2026-10-17): no Building definition in `assets/defs/buildings/` references a poly.pizza model any more, so the Public facilities and Worship places seem rebuilt (managed models such as `community-hall-*` and `concert-hall-*` exist). Not verified in the game, and the boxes above are not ticked yet.

Left: confirm in the game each family (Model id, footprint, distinct Tiers), then the baselines. The 51 poly.pizza entries still in `assets/models.json` are used by no Building; removing them and their license entries is shared with issue 06.
