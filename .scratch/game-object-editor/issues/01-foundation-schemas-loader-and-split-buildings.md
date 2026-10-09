# Foundation: zod schemas, generated JSON Schemas, loader and buildings split into files

Status: resolved
Spec: [game-object-editor](../spec.md)

Add zod. Define the Building schema as a discriminated union on `kind`, covering today's fields of `assets/buildings.json` only (no Tier data yet). Generate `.schema.json` files and id unions (replacing `buildingTypes.generated.ts`), with a staleness test. Write the reference validator (model keys for now). Split `assets/buildings.json` into `assets/defs/buildings/<id>.json` with `$schema` and `order`, load them through `import.meta.glob` with zod parsing in dev, test and build (build fails on an invalid file). Port `scripts/buildingsFile.ts` and `/api/buildings` to the per-file layout. Game behaviour unchanged.

## Comments

Delivered (2026-10-09):

- Schema `src/core/buildings/buildingSchema.ts` (zod 4): `kind` is `standard`, `sport` or `nature`; `sport.radius`, `sport.wellbeingBonus` and `nature.family` are now top-level fields. `standard` is a placeholder kind until the Tier slices split it into rule families. `FlatBuilding` (`buildingDefinition.ts`) is the game-facing view with every field optional.
- 220 files in `assets/defs/buildings/`, `order` in steps of ten; `assets/defs/schemas/building.schema.json` generated; `npm run defs:generate` regenerates after a hand edit.
- Game loads with `import.meta.glob`; node scripts read through `scripts/buildingsDir.ts` (`assetPacks.ts` no longer imports game modules for nature models).
- `build/validateDefinitions.ts`: build fails, dev server warns at start and shows an overlay on change; no zod in the production bundle (checked).
- Reference validator `scripts/modelReferences.ts` (available pack, managed and Poly Pizza models), reused by `scripts/assets.test.ts`.
