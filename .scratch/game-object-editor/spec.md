# Game object editor

Decided in a grilling session (2026-10-09). See [ADR 0021](../../docs/adr/0021-game-objects-one-file-each-validated-by-generated-json-schemas.md), [ADR 0022](../../docs/adr/0022-model-ids-decoupled-from-file-paths.md), [ADR 0023](../../docs/adr/0023-tier-values-and-balancing-as-data-formulas-in-code.md) and the terms **Game object**, **Model id**, **Model definition** and **Retired** in `CONTEXT.md`.

## Goal

Turn `tools/assets-editor` into a game design tool: every Game object (Building, Fixture, Vehicle, Service vehicle, Transit fleet vehicle, Boat, Material, Good, Crop), its values per Tier and the balancing constants are JSON files validated by generated JSON Schemas, and the editor edits them through forms shaped by their kind. Models become a library the Game objects draw from.

## Data

- `assets/defs/<kind-dir>/<id>.json`, one file per Game object, `"$schema"` pointing to `assets/defs/schemas/<kind>.schema.json`. Singletons: `assets/defs/balance/<domain>.json`, `assets/defs/infrastructure/<domain>.json`, `assets/defs/packFormats.json`. Build menu order: an `order` field.
- `kind` = family of rules in code (`home`, `production`, `storage`, `utility`, `facility`, `casino`, `venue`, `sport`, `nature`, `boat`, `transitVehicle`, `trafficVehicle`, `serviceVehicle`, `material`, `good`, `crop`, `fixture`…). Families inside a kind are closed enums bound to code.
- `tiers: [...]`: `tiers[0]` is Tier 1, each Tier inherits unset fields from the previous one, the number of Tiers is the array length. No root field for anything that varies by Tier. Formulas of today are unfolded into explicit values.
- Unlocks by Tier stay on the unlocked object (`minTier`, `minRank`).
- `variants: { <name>: { tiers: [{ model?, footprint?, recolor? }] } }`, visual only.
- `name` and `description` `{ en, fr }` in the file. Descriptions may use ICU MessageFormat placeholders over the object's flattened fields (`cost`, `tier1.capacity`, `maxTier.capacity`, `tierCount`) and over values computed by code, declared per kind in a typed registry with a label.
- Durations in minutes in JSON, milliseconds in code.
- Crop packs (Crate, Box, Pallet) stay derived from Crops and `packFormats.json`.
- Material and Good icons are generated from their model.
- `retired: true` instead of deletion; ids of Game objects are immutable.
- Model definitions keyed by Model id (`<pack>-<basename>` at migration), `file` field for the path. The scene keys loaded models by file; definitions are translated from id to file where the game reads them, so no legacy table is needed.

## Code

- zod schemas in `src/` are the source; generated: TS types, `.schema.json` files, id unions (`*.generated.ts`). A test fails when a generated file is stale.
- Reference validator (models, Goods, Materials, Venue types, placeholders) shared by the editor, vitest and the build.
- Loading via `import.meta.glob` with zod parsing in dev, test and build; build fails on invalid data; no parsing in production.
- No format version: a schema change rewrites every file in the same commit through a one-off script.
- End state: no Model id literal in `src/` (test), `MODEL_KEYS` computed from the definitions, `MAX_*_TIER` constants gone.

## Editor

- Stack: Tailwind, Radix (shadcn-style components), dnd-kit.
- Layout: left = kind navigation + object list (search, filters, error badges); centre = tabs General / Tiers / Variants / Description / Used by; right = 3D preview of the selected Tier and variant, with the model library drawer below (search, thumbnails, source and license, used by or orphan).
- Tiers tab: matrix, rows = fields, columns = Tiers; inherited values greyed, click to override; selecting a column drives the preview; add or remove a Tier at the end; read-only "unlocks" row.
- Description tab: list of available values with their current value, click to insert, live en and fr rendering.
- Drag and drop: model from the library to a model cell; `.glb`, `.zip` or Poly Pizza URL dropped anywhere opens the import flow (license required); reorder within a build menu section. Id references use comboboxes with autocompletion.
- Create (kind, family, unique id) or Duplicate; Retire instead of delete; real deletion only when unreferenced and absent from save fixtures. Model Rename rewrites every reference.
- Edits in memory, dirty marker per file, undo and redo, Cmd+S writes every dirty file atomically; saving is refused on errors, allowed on warnings; after writing, generated files are refreshed and the game reloads by HMR.
- Second wave: comparison view per kind (every object × one field per Tier, table and curve, editable inline).

## Out of scope

Mods or runtime loading of definitions, declarative rules in JSON, renaming Game object ids, editing zips or GLBs, hand-drawn icons.

## Delivery

Successive slices, each with build and tests green and identical game behaviour (every save fixture still loads): see `issues/01` to `issues/17`.
