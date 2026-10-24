# Internalize the remaining third-party models

152 models in `assets/models.json` are not `managed` yet (628 are). Replace each with our own low-poly model (`source: managed`, `license: Own work`), one at a time, shown in Blender at every step.

## Order

### 1. Quaternius — farm barn (1)
- [x] farm-barn

### 2. Quaternius — crops (101)
Each crop: stages 1 to 4, plus `-crop` and `-harvested` when present.
- [x] apple (1-4, crop, harvested)
- [x] bamboo (1-4, crop)
- [x] beet (1-4, crop)
- [x] bushberries (1-4, crop, harvested)
- [x] cactus (1-4, crop, harvested)
- [x] carrot (1-4, crop)
- [x] corn (1-4, crop, harvested)
- [x] flower (1-4, flowers-crop, flowers-harvested)
- [x] grass (1-4)
- [x] lettuce (1-4, crop, harvested)
- [x] mushroom (1-4, crop, harvested)
- [x] orange (1-4, crop, harvested)
- [x] palmtree (1-4, crop, harvested)
- [x] pumpkin (1-4, crop, harvested)
- [x] rice (1-4, crop)
- [x] tomato (1-4, crop, harvested)
- [x] watermelon (1-4, crop, harvested)
- [x] wheat (1-4, crop)

### 3. Poly Pizza (50)
Only the pool table was used by the game (the Billiard fixture). It is now our own model, `mini-arcade-pool-table` (`mini_arcade.py`). The 49 other entries and their sources were unused catalogue entries and are deleted, so the monuments, services and remaining groups need no rebuilding.
- [x] pool-table
- [x] the 49 unused entries removed from `assets/models.json` and `assets/poly.pizza/`

## Done
Every model the game ships is our own. The Poly Pizza tooling is removed (fetch script, `scripts/polyPizza.ts`, editor import mode and link drop, the `poly.pizza` model source and its credits). Quaternius `buildings.zip` is kept for the asset editor; the in-game Credits dialog still lists Quaternius (`PACK_CREDITS`).
