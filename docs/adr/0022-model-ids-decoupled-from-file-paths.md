# Model ids are decoupled from file paths

Accepted. Amends [ADR 0012](0012-models-json-single-source-of-model-definitions.md), which kept the file path as the model key because renaming "would break saves".

That premise was false: no save holds a model key (checked on every fixture from v1 to v12), only code and definitions do. A Model definition is now keyed by a Model id, a slug chosen by hand, and carries its file path in a `file` field. Moving or renaming a file never changes the id.

- The migration names every model mechanically `<pack>-<basename>` (`suburban-building-type-k`, `mini-arcade-pinball`); better names come later through the editor's Rename, which rewrites every reference in the definitions, and a test proves none is left.
- A `legacyKeys` table (old path → Model id) is read by a resolver only while code still holds path literals. Once every model is owned by a Game object or by `assets/defs/infrastructure/` (Venue shells, Staff and Visitor silhouettes, Crop growth stages and solar panels included), a test forbids any Model id literal in `src/` and the table is deleted.
- `MODEL_KEYS` is computed from the definitions, so "used in game" and orphan detection become exact.

Rejected: keeping paths (renames of files ripple into gameplay data), opaque UUIDs (unreadable in diffs and JSON).
