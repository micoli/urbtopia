# Tile Field Layer And Pollution

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

The reusable machinery for tile-field Layers: a pure core type (`TileField`: values per tile, bounds, unit key), a scene `AnalyticsLayer` drawing a coloured tile mesh with a colour ramp, and a legend component. First Layer: Pollution, evaluating the existing coal and Incinerator reach penalties for a Home standing on each tile (worst source, as the maluses do).

## Acceptance criteria

- [ ] `pollutionField(state)` is pure, deterministic, independent of building order, tested on small hand-built cities.
- [ ] The value at a Home's tile equals the Pollution penalty `homeBenefits` applies to that Home.
- [ ] Scene layer recomputes only when buildings change, not each frame.
- [ ] Legend shows ramp and bounds; empty city shows an empty Layer with its legend.
- [ ] Storybook story for the legend.
