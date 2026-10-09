# Foundation: zod schemas, generated JSON Schemas, loader and buildings split into files

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)

Add zod. Define the Building schema as a discriminated union on `kind`, covering today's fields of `assets/buildings.json` only (no Tier data yet). Generate `.schema.json` files and id unions (replacing `buildingTypes.generated.ts`), with a staleness test. Write the reference validator (model keys for now). Split `assets/buildings.json` into `assets/defs/buildings/<id>.json` with `$schema` and `order`, load them through `import.meta.glob` with zod parsing in dev, test and build (build fails on an invalid file). Port `scripts/buildingsFile.ts` and `/api/buildings` to the per-file layout. Game behaviour unchanged.
