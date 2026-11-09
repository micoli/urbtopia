# Models, Fixture defs and the Link engine

Status: resolved
Blocked by: none

- Register the 19 models as `factory-floor-*` in `assets/models.json`; floor, wall and wall corner are marked `.reserved` until the scene uses them.
- Fixture schema gains the `factory` venue: `role`, `drive`, `flow`, `turns`, `speed`, `yield`; categories `power`, `plumbing`, `machines`.
- 13 Fixture defs, `assets/defs/balance/factoryFloor.json` (size and caps by Tier).
- `src/core/factory/factoryFloor.ts`: `floorLinksOf`, `floorBonusOf`, `floorGridSizeOf`, with tests.
- Done when: `tsc`, lint and the tests pass.

## Answer

Done. A cycle of Gears on a grid always has even length, so the jam is a group fed in two opposite directions (two Motors, or a Shaft that skips a mesh); CONTEXT.md corrected.
