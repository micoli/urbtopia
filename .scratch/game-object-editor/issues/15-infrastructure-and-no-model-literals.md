# Infrastructure models and no Model id in src

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 06, 07, 08, 09, 10, 11, 12, 13, 14

Named model slots under `assets/defs/infrastructure/` (roads, rails, bridge pieces, solar panel if not owned by a Home variant). Compute `MODEL_KEYS` from the definitions. Add a test forbidding any Model id literal in `src/`; delete `legacyKeys` and its resolver.
