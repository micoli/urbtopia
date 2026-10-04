# A crops compartment filled by the Grain silo

Crop Materials get a storage compartment of their own, `crops`, next to `materials` and `goods`. Only the Grain silo (a new unique storage with Tiers, which requires a Farm) and the Farm itself (a base capacity of 10) add capacity to it. The Storehouse and the Silo no longer hold Crop Materials.

## Why

- A Harvest sharing the Materials compartment with wood and stone made the Storehouse the place where food is kept, which players found wrong, and let crops crowd out production Materials.
- Strict separation answers that feedback directly. The Farm base capacity keeps the first Harvest possible before the player can afford a Grain silo.
- The compartment is derived from the item (`compartmentOf`), not stored: Crop Materials stay in `storage.materials`. The save shape is unchanged, so no migration or new fixture is needed, and existing stock moves to the crops compartment for free.

## Consequences

- Existing saves may hold more crops than the new capacity. The stock is kept and only blocks the next Harvest until the player sells, packs or builds a Grain silo, in line with the demolition rule of ADR 0004.
- A Grain silo cannot be sold while the crops stock would no longer fit.
- Alternatives rejected: renaming the Silo (breaks existing saves and the glossary), a soft separation where the Storehouse absorbs overflow (does not answer the feedback), packed crops in the Grain silo (they are finished Goods and stay with the Goods).
