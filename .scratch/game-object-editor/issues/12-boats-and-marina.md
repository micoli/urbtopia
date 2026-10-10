# Boats and Marina

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

`boat` kind with `family` (pleasure, fishing, casino), several Boats per family allowed: cost, unlock, family stats (`BOATS`), `BOAT_MODELS`. `MARINA_TIERS` into `marina.json`. Saved Boats keep loading (family and id unchanged).

## Comments

Delivered (2026-10-10):

- Boats are a collection (`assets/defs/boats`, one file per Boat, schema discriminated by family): model, cost, unlock, and for the pleasure family its radius, Well-being bonus and operating cost. Saved Boats keep their family; the first live Boat of a family is the one sold. `BOATS` and `BOAT_MODELS` read the files.
- The Marina is a `marina` kind whose Tiers hold the Boats moored and the upgrade cost; `MARINA_TIERS` is gone.
