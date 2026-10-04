# Crop Materials

Status: ready-for-agent
Blocked by: 03
Spec: ../spec.md

## What to build

One Crop Material per species, so a Harvest can store its yield. They live alongside existing Materials but are never produced by a Workshop and never sold directly.

## Acceptance criteria

- [ ] `MaterialId` (`src/core/economy/items.ts`) gains the 18 species ids; their Unlock threshold matches the species table.
- [ ] Workshops cannot produce Crop Materials: `producibleItems('workshop')` is unchanged.
- [ ] Crop Materials are stored in the Materials compartment (Storehouse/Silo) and count toward its capacity.
- [ ] Shop, Market and Factory recipes never accept a Crop Material.
- [ ] Saved storage with Crop Materials round-trips; no migration needed beyond issue 01 if the storage map is open.
- [ ] FR/EN names; storage UI lists Crop Materials.
- [ ] Tests: Workshop exclusion, storage capacity, Unlock gating.
