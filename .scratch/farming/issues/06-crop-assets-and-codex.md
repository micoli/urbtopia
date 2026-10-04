# Crop assets and Codex

Status: resolved
Blocked by: 04
Spec: ../spec.md

## What to build

Final models for the stages of each of the 18 species (four growth stages, ready, and the after-harvest stage where it exists), final Farm and Packhouse models, and Codex entries for the species and their packed Goods.

## Assets

Quaternius archives dropped locally (no download URL): `assets/quaternus/crops.zip` and `assets/quaternus/farm-buildings.zip`. Both contain FBX only (`FBX/<Name>.fbx`); the scene loads GLTF only (`src/scene/modelLibrary.ts`).

Naming in `crops.zip`: `<Species>_1..4` (growth stages), `<Species>_Crop` (ready), `<Species>_Harvested` (after harvest). Species map to `Apple`, `Bamboo`, `Beet`, `BushBerries`, `Cactus`, `Carrot`, `Corn`, `Flower` (ready: `Flowers_Crop`, `Flowers_Harvested`), `Grass`, `Lettuce`, `Mushroom`, `Orange`, `PalmTree`, `Pumpkin`, `Rice`, `Tomato`, `Watermelon`, `Wheat`. `Coconut_Half` is unused.

Gaps:
- `Grass` has no `_Crop`: ready falls back to `Grass_4`.
- No `_Harvested` for Bamboo, Beet, Carrot, Grass, Rice, Wheat: the after-harvest stage is skipped and the tile returns directly to an empty Field.

Buildings from `farm-buildings.zip`: `Barn` for the Farm, `OpenBarn` for the Packhouse.

## Acceptance criteria

- [ ] The asset build script extracts both Quaternius archives from `assets/quaternus/` (local source, no fetch) and converts FBX to GLB at build time; runtime keeps a single GLTF loader.
- [ ] Every species maps to its stage models with the fallbacks above; scale and orientation match one tile of the Kenney kits.
- [ ] Farm and Packhouse use their Quaternius models instead of placeholders.
- [ ] Codex lists species with their Unlock threshold, growth time, water need and yield, and the packed Goods with their recipe and value.
- [ ] Quaternius (CC0) credited alongside Kenney.
- [ ] FR/EN strings.

## Comments

- Ready stage: rendered as the mature plant (`<Species>_4`) with the `<Species>_Crop` produce model next to it, because `_Crop` alone is a small loose item (an apple, a sheaf) that would make the plant vanish. Grass has no produce model and shows `Grass_4` only. Revisit visually if the `_Crop`-only look is preferred.
- Models are converted at install time (`scripts/quaternius.ts`): one scale per species (widest growth stage fits one tile, height capped), produce and buildings fitted by width.
- Thin species (wheat, bamboo, rice) show a single plant per tile and look sparse; several plants per tile is a possible follow-up.
