# Model ids are decoupled from file paths

Accepted. Amends [ADR 0012](0012-models-json-single-source-of-model-definitions.md), which kept the file path as the model key because renaming "would break saves".

That premise was false: no save holds a model key (checked on every fixture from v1 to v12), only code and definitions do. A Model definition is now keyed by a Model id, a slug chosen by hand, and carries its file path in a `file` field. Moving or renaming a file never changes the id.

- The migration names every model mechanically `<pack>-<basename>` in lowercase (`suburban-building-type-k`, `buildings-2story-stairs-mat`); better names come later through the editor's Rename, which rewrites every reference in the definitions. Every model a Game object uses has an entry, so Kenney and Quaternius models that had none got a CC0 one.
- Definitions (`assets/defs/`) refer to models by Model id only, and a reference validator checks that the id exists and that its file ships.
- The scene keeps keying loaded models by file: definitions are translated from id to file where the game reads them (`modelFileOf`). Path literals still in code are therefore valid as they are, and no legacy table from path to id is needed; they move to definitions as Game objects take over their models, until a test forbids any model literal in `src/`.
- `MODEL_KEYS` stays the list of files the scene can ask for, so "used in game" and orphan detection keep working.

Rejected: keeping paths (renames of files ripple into gameplay data), opaque UUIDs (unreadable in diffs and JSON), a `legacyKeys` table (redundant while the scene keys by file).
