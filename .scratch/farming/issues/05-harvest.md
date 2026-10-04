# Harvest

Status: ready-for-agent
Blocked by: 04
Spec: ../spec.md

## What to build

A harvest drag gesture that collects every ready Crop under the pointer in one sweep. The yield goes to storage as Materials, and the species' seed share becomes Seed packs.

## Acceptance criteria

- [ ] Harvest ignores unready tiles and works for any species.
- [ ] Yield is added as a Material; the seed share goes to the Farm stock, surplus lost when full.
- [ ] If the compartment is full, the Crop stays ready and nothing is lost.
- [ ] Harvested tile shows the visual "after harvest" stage, then returns to an empty Field.
- [ ] Single undoable-free gesture on mouse and touch.
- [ ] Tests: yield, seed share, full storage, mixed species sweep.
