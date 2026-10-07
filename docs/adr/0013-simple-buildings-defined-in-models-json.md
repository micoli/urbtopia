# Simple buildings are defined in models.json, edited by tools/assets-editor

Accepted. Amends [ADR 0012](0012-models-json-single-source-of-model-definitions.md), which kept "wiring a new asset into gameplay" as manual code.

Sport venues and nature elements (decoration, green spaces) are buildings whose only features are a model, a footprint, a price, an unlock threshold, a name and, for sport, a Well-being radius and bonus. They were duplicated across `sportVenues.ts`, `NATURE_MODELS`, `natureNames.ts` and the footprint already stored in `models.json`, and the copies drifted apart. Their definition now lives in an optional `building` block of the model's entry in `assets/models.json`:

- `kind: 'sport'`: `id`, `name` and `description` (en and fr), `unlockCitizens`, `cost`, `radius`, `wellbeingBonus`. The footprint is the entry's own `footprint`.
- `kind: 'nature'`: `id`, `name` (en and fr) and `family`. Cost, unlock, radius and benefits stay in `NATURE_FAMILIES`, per family.

`src/core/buildings/buildingDefinitions.ts` reads the file and `SPORT_VENUES` and `NATURE_MODELS` are derived from it, so every consumer (specs, unlocks, build menu, codex, i18n, toasts) is unchanged. The assets editor edits the block with a "Building" form; `writeModels` validates it (required names, integer counts, known family, unique ids).

Building ids must stay literal types so that `Record<BuildingType, …>` keeps reporting missing cases. They are generated into `src/core/buildings/buildingTypes.generated.ts` each time `writeModels` writes the real file, and a test fails when the committed file is out of date.

Buildings with several models or real rules (Homes, Factories, Casinos, public facilities, transport, energy) stay in code: a model definition describes one model.

Consequence: a new sport venue or nature element is added by dropping the model in the editor and filling the Building form; no source file changes. The build menu order of nature elements now follows the sorted model keys of `models.json`.
