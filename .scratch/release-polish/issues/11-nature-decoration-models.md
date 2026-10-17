# Replace the nature decoration models

Status: ready-for-agent
Blocked by: 01, 02
Spec: ../spec.md

## Acceptance criteria

- [ ] The 161 `nature-*` and 11 `mini-forest-*` decoration definitions no longer use Kenney models: trees, rocks, cliffs, bushes, flowers, mushrooms, platforms, tents and stones are rebuilt in the house style, keeping every Model id, footprint and game object id (ids live in saves).
- [ ] Built from a small set of shared shapes and the locked palette (a few tree, rock and cliff families with variants), not 172 one-off models; the budget per piece is low because they are instanced by the thousand in the Wild land.
- [ ] Triangle budget per piece set and checked; a recipe per family in `assets/managed-models/` and a Model definition per piece.
- [ ] The kit of issue 01 is extended for nature (the current one covers buildings only), keeping the control render.
- [ ] The Kenney nature and `mini-forest` models are removed from `assets/` and `models.json` once unused; `docs/asset-catalog.md` updated.
- [ ] Baselines updated and reviewed.
