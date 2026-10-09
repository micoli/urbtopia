# Model ids decoupled from file paths

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 01

Key `assets/models.json` by Model id (`<pack>-<basename>`, unique) with a `file` field; zod schema for Model definitions. Add `legacyKeys` (old path → Model id) and a resolver used wherever code still passes a path literal. Rewrite references in `assets/defs/`. Add the Rename operation in `scripts/` (rewrites every reference, test proves none is left) and its endpoint. Generate the `ModelId` union. Credits, orphan detection and the editor keep working.

## Comments

Delivered (2026-10-09):

- `assets/models.json` keyed by Model id with `file` (382 entries: the 349 existing ones plus CC0 entries for the 33 Kenney and Quaternius models buildings used without one). Schema `src/core/models/modelSchema.ts`, generated `assets/defs/schemas/models.schema.json` and `src/core/models/modelIds.generated.ts`.
- Buildings refer to Model ids; the game translates them to files with `modelFileOf` (`src/core/models/modelFiles.ts`). The scene, `MODEL_DEFINITIONS` and credits stay keyed by file, so no `legacyKeys` table was needed (ADR 0022 updated).
- `renameModel` (`scripts/assetOperations.ts`, endpoint `/api/assets/rename-model`) rewrites `models.json` and every building, refusing if a building would be left with an unknown id.
- The current editor works through file-keyed views (`scripts/editorViews.ts`), to be removed by issue 03.
