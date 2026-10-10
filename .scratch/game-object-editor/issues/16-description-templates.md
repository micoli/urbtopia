# Description templates

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 09, 10

ICU MessageFormat (`intl-messageformat`) in `description`. Values: the object's flattened fields (`cost`, `tier1.x`, `maxTier.x`, `tierCount`) plus a typed registry of computed values per kind with labels. Replace the sentences built in `src/i18n/facilities.ts`, `sportVenues.ts`, `buildings.ts`, `nature.ts` and the generated Casino description; codex output identical. Validator rejects unknown placeholders. Editor Description tab: value list with current values, click to insert, live en and fr rendering.

## Comments

Delivered (2026-10-10):

- Descriptions are ICU MessageFormat templates (`intl-messageformat`) rendered by `renderDescription`. The sentences built in `src/i18n/facilities.ts`, `sportVenues.ts`, `buildings.ts`, `nature.ts` and the generated Casino description moved into the files (`description` of facilities, sport venues and the Casino; `assets/defs/descriptions/nature.json` for the nature families). The codex messages are identical to before in both languages.
- Values: the numeric fields of the object (`cost`, `radius`…), those of its first and highest Tier and the Tier count, plus a typed registry of computed values per kind with a label (`COMPUTED_VALUES`: reach side, footprint, capacity limit…). ICU argument names cannot hold a dot, so `tier1.capacity` is written `tier1Capacity` and `maxTier.capacity` `maxTierCapacity`.
- The validator rejects a description that is not valid ICU or that uses an unknown placeholder, in the build, the tests and the editor.
- Editor Description tab: both languages as editable templates with their live rendering, and the list of values with their current value, click to insert at the caret of the language being edited.
