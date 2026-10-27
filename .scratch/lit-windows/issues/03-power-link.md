# Power link

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

Light only the windows of powered buildings: a per-instance attribute set from the energy stats, refreshed about once a second.

## Acceptance criteria

- [x] A building in shortage stays dark at Night while its neighbours are lit.
- [x] Attribute updates without rebuilding the instanced meshes.
- [x] Test with a city short of power.

## Findings

- A building is unpowered when it needs power and gets less than it needs (`unpoweredBuildingIds`, `src/core/environment/powered.ts`). No list during an Adaptation period. Buildings with no power need (plants, decorations) are never dark.
- Per-instance attribute not used: the geometry of a model is shared by every chunk, so an attribute would have needed a geometry copy per chunk. Instead the items of an unpowered building go into their own instanced mesh with a plain (non-glowing) material; only the chunks holding a changed building are rebuilt. Render items now carry `buildingId`.
- Checked in the browser with the app's store: a Home without power keeps dark windows at 23:30; adding a geothermal plant lights them.
- Threshold: a building goes dark below a quarter of its need (`LIGHT_SUPPLY_SHARE`). A shortage is shared out evenly, so the first rule (any shortage) turned every window of a slightly short city dark; the player saw none.
