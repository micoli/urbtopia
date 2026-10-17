# Wild land scenery is derived from the seed and never saved

Accepted. Extends [ADR 0003](0003-localstorage-versioned-save-envelope.md) and [ADR 0001](0001-imperative-three-chunked-instancing.md), which stay valid.

The scenery of the Wild land (trees, rocks, hills, a rim at the edge of the map) is computed at load from the city's seed and from the Parcels the player owns. It is rendered with the same chunked instancing as the rest of the world. It is not part of the save, has no hitbox, blocks nothing and cannot be interacted with. Buying a Parcel removes the scenery on it. It is distinct from the nature models the player places.

## Why

- Nothing is saved, so the save format and the cloud mirror do not change and old cities get the new look at once.
- Deriving from the seed keeps the same city looking the same from one session to the next, and on every device.
- Without interaction there is no gameplay state to balance, migrate or validate.

## Consequences

- The scenery cannot be moved, kept or sold. If scenery ever becomes interactive (clearing it for a fee, resources), its state must be saved and this decision revisited.
- The scenery counts in the render budget and is limited by it (see [ADR 0034](0034-zero-cost-lighting-on-mobile.md)).
- Changing the generation changes the look of existing cities.
