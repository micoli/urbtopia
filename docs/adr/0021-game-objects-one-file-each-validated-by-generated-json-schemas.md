# Game objects are defined one file each, validated by JSON Schemas generated from zod

Accepted. Supersedes [ADR 0014](0014-all-buildings-defined-in-buildings-json.md) and amends [ADR 0012](0012-models-json-single-source-of-model-definitions.md), which rejected a schema library.

Every Game object (Building, Fixture, Vehicle, Service vehicle, Transit fleet vehicle, Boat, Material, Good, Crop) is a JSON file of its own under `assets/defs/<kind>/<id>.json`; game-wide balancing constants and infrastructure models are singleton files under `assets/defs/balance/` and `assets/defs/infrastructure/`. `tools/assets-editor` becomes a Game object editor first and an asset library second.

## Decisions

- **Shape by rule family.** Each file has a `kind`, the family of rules in code that reads it (`home`, `production`, `storage`, `utility`, `facility`, `casino`, `venue`, `sport`, `nature`, `boat`, `transitVehicle`…), and the schema of a kind is a discriminated union member. A new object of an existing kind is data only; a new kind needs code and a schema. Families inside a kind (`pleasure`, `coal`, `arcade`…) are closed enums bound to code.
- **zod is the source.** Schemas live in `src/` as zod; the TS types and the `.schema.json` files (referenced by `$schema` in each file, for the IDE and the editor's forms) are generated, and a test fails when the generated files are stale. Id unions (`BuildingId`, `FixtureId`, `GoodId`, `ModelId`…) are generated too, so `Record<Id, …>` keeps reporting missing cases.
- **Integrity beyond shape.** A shared reference validator checks that every referenced id exists (models, Goods in upgrade costs, Materials in recipes, Venue types). It runs live in the editor, in vitest and at build.
- **Build-time loading.** The game imports the files with `import.meta.glob` and parses them with zod in dev, test and build; the build fails on an invalid file. Production ships checked data and does not parse at runtime. Mods and runtime loading are out of scope.
- **No format version.** Definitions are compiled with the game and never read by another version: a schema change rewrites every file in the same commit with a one-off script.
- **Text in the file, numbers by template.** `name` and `description` (en, fr) stay in the Game object's file. Descriptions that quote numbers use ICU MessageFormat placeholders (plurals, `select` for conditions); the values available are the object's own fields, flattened and indexed by Tier, plus values computed by code and declared per kind in a typed registry. The editor lists them with the current value of the object and renders both languages live; an unknown placeholder is a validation error. This replaces the hand-built sentences of `src/i18n/facilities.ts` and its siblings.
- **Ids are immutable, objects are Retired.** Game object ids live in saves, so the editor never renames them and replaces deletion by `retired: true`; an object is removed for real only when nothing references it and no save fixture holds it.

## Considered options

- **One file per kind** (`buildings.json`): kept for one more step, rejected because of 60 KB diffs, merge conflicts and no natural drag-and-drop unit.
- **Hand-written JSON Schemas with ajv**: two sources of truth for the types. **Types and a test only** (ADR 0012): no schema for the IDE nor for generating the editor's forms.
- **Parsing in production**: bundle and mobile CPU cost for data already checked at build.
- **A home-made `{placeholder}` engine**: no plurals in French and English, no conditions.
