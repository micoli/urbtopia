# Harvest

Status: ready-for-agent
Blocked by: 04, 08
Spec: ../spec.md

## What to build

A harvest drag gesture that collects every ready Crop under the pointer in one sweep. The yield goes to the Materials compartment as Crop Materials, and the species' seed share becomes Seed packs.

## Acceptance criteria

- [ ] Harvest ignores unready tiles and works for any species.
- [ ] Per species and per sweep, returned Seed packs = `floor(total yield × seed share)`; the rest is added as the Crop Material. Seed surplus is lost when the Farm stock is full.
- [ ] If the Materials compartment (Storehouse/Silo) is full, the Crop stays ready and nothing is lost.
- [ ] Harvested tile shows the visual "after harvest" stage, then returns to an empty Field.
- [ ] Single gesture with no undo, on mouse and touch.
- [ ] Tests: yield, seed share rounding, full storage, mixed species sweep.
