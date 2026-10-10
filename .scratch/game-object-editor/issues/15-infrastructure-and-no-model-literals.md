# Infrastructure models and no Model id in src

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 06, 07, 08, 09, 10, 11, 12, 13, 14

Named model slots under `assets/defs/infrastructure/` (roads, rails, bridge pieces, solar panel if not owned by a Home variant). Compute `MODEL_KEYS` from the definitions. Add a test forbidding any model literal (id or file) in `src/`; the scene reaches every model through a definition.

## Comments

Delivered (2026-10-10):

- Named model slots under `assets/defs/infrastructure/`: `roads` (the eight pieces), `rails`, `bridge` and `scenery` (park tree, solar panels, Venue visitors); each Public facility holds its `detailModel`. Singletons can now point to Model ids: they are validated, counted as users of a model, installed with their pack and rewritten by a Model rename.
- Cars, trains, rails, panels and awnings became Model ids; the scene reads them all through definitions, and `src/modelLiterals.test.ts` fails on any Model id, model file or pack path written in `src/`.
- `MAX_ROAD_TIER` follows the road costs; the other `MAX_*_TIER` follow their Tiers.
- The editor shows the infrastructure under Settings, with a model picker (and a list picker for the visitors) driven by a `modelId` hint in the schema.
