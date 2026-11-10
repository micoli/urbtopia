# Home interior engine, Comfort, save and UI with existing models

Status: resolved
Blocked by: none

- Fixture schema gains the `home` venue; Home Fixture files reusing existing models (chair, table, stove, beds, bathroom pieces, television, sofa, armchair, plants, lamp, rug).
- `assets/defs/balance/homeInterior.json`: grid size by Tier, group weights, Well-being cap by Tier.
- Core: Comfort by group coverage (table+chair adjacency, bathroom pairing, diminishing decor), Well-being bonus per Home, pure and tested.
- State, commands (place, move, remove with 50 % refund), save with version bump and migration to an empty interior.
- Home side panel: "Furnish" button, Comfort bar; Management view opens the Home interior; Well-being detail line "Comfort +X".
- Done when: `tsc`, lint, tests and a Playwright test (`?e2e`, run headed) pass.
