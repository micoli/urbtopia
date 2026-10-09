# Description templates

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 09, 10

ICU MessageFormat (`intl-messageformat`) in `description`. Values: the object's flattened fields (`cost`, `tier1.x`, `maxTier.x`, `tierCount`) plus a typed registry of computed values per kind with labels. Replace the sentences built in `src/i18n/facilities.ts`, `sportVenues.ts`, `buildings.ts`, `nature.ts` and the generated Casino description; codex output identical. Validator rejects unknown placeholders. Editor Description tab: value list with current values, click to insert, live en and fr rendering.
