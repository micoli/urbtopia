# Materials, Goods and Crops as Game objects

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 03

Move `BASE_MATERIALS`, `FISH_MATERIAL`, `BASE_GOODS` (`src/core/economy/items.ts`) and `CROP_TABLE` (`src/core/farming/crops.ts`) to one file each under `assets/defs/`, durations in minutes, named fields. Crops carry their growth stage models; Materials and Goods carry a model for icon generation (`generate-icons.py` reads it). `PACK_FORMATS` goes to `packFormats.json`; packs stay derived. Generated `MaterialId`, `GoodId`, `CropId`. Validator checks recipe references. Editor forms per kind. Placed before the building slices because upgrade costs reference Goods.

## Comments

Delivered (2026-10-09):

- One file per Material (`assets/defs/materials`, with `producedBy`: workshop or fishingBoat), Good (`goods`, recipe of Material or Crop ids) and Crop (`crops`, named fields, durations in minutes, growth stage, produce and harvested Model ids); `assets/defs/packFormats.json` holds the pack formats, crop packs stay derived. Names moved from `messages.ts` and `fr.ts` into the files.
- Generic registry `scripts/collections.ts` (dir, schema, id rule, references, generated id unions) and `scripts/singletons.ts`: reading, stable writing, validation with cross-references, JSON Schemas and id unions now work for any collection; buildings run on it too.
- The game loads every collection through `import.meta.glob` (`src/core/defs/entries.ts`); crop growth models come from the Crop files. Pack files install every model a definition uses.
- Editor: Materials, Goods, Crops and Settings (singletons) lists and forms; records of ids (recipes), lists of models (growth stages) and lists of objects (pack formats); Model Rename and "used by" cover every collection.
- No icon pipeline exists for Materials and Goods yet (`generate-icons.py` only draws the PWA icons): `model` is optional and unused by the game until icons are generated from it.
