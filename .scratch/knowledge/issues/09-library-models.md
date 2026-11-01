# 09 Library 3D models

Status: ready-for-human
Blocked by: 01

Use `create-building-model`, one model at a time, shown in the live Blender at every step, texts on models in English. Three models: 2x2 (Tiers 1-2), 3x2 (Tiers 3-4), 4x2 (Tier 5). Replace the provisional School model in the def, keep footprints in the tier entries. Commit only on request.

## Comments

Trial models need the user's decision on the direction before they are built, one at a time. The Library currently shows the School model, stretched, as a placeholder. The Codex images of the Library (`npm run test:codex`) must be regenerated once the models are final, or `scripts/codexImages.test.ts` fails locally on a clean build.
