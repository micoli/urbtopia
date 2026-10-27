# Power link

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Light only the windows of powered buildings: a per-instance attribute set from the energy stats, refreshed about once a second.

## Acceptance criteria

- [ ] A building in shortage stays dark at Night while its neighbours are lit.
- [ ] Attribute updates without rebuilding the instanced meshes.
- [ ] Test with a city short of power.
