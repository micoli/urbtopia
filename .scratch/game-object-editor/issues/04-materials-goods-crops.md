# Materials, Goods and Crops as Game objects

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 03

Move `BASE_MATERIALS`, `FISH_MATERIAL`, `BASE_GOODS` (`src/core/economy/items.ts`) and `CROP_TABLE` (`src/core/farming/crops.ts`) to one file each under `assets/defs/`, durations in minutes, named fields. Crops carry their growth stage models; Materials and Goods carry a model for icon generation (`generate-icons.py` reads it). `PACK_FORMATS` goes to `packFormats.json`; packs stay derived. Generated `MaterialId`, `GoodId`, `CropId`. Validator checks recipe references. Editor forms per kind. Placed before the building slices because upgrade costs reference Goods.
