# Model ids decoupled from file paths

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 01

Key `assets/models.json` by Model id (`<pack>-<basename>`, unique) with a `file` field; zod schema for Model definitions. Add `legacyKeys` (old path → Model id) and a resolver used wherever code still passes a path literal. Rewrite references in `assets/defs/`. Add the Rename operation in `scripts/` (rewrites every reference, test proves none is left) and its endpoint. Generate the `ModelId` union. Credits, orphan detection and the editor keep working.
