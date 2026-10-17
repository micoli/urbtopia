# Asset catalog (Kenney City Kits)

Machine-readable data: [`assets/models.json`](../assets/models.json) (Model definitions keyed by Model id, each with its `file`, see [ADR 0012](adr/0012-models-json-single-source-of-model-definitions.md) and [ADR 0022](adr/0022-model-ids-decoupled-from-file-paths.md)). Decided with the owner in the assets editor (`tools/assets-editor/`). Source facts: [`research/kenney-city-kits.md`](research/kenney-city-kits.md).

## Conventions

- 1 unit = 1 road tile. Y up, ground at Y=0, models centred on X/Z. Rotations are multiples of 90 degrees around Y.
- **Front (door) is -Z at rotation 0** for every building (checked visually on commercial, suburban and industrial). Roads and buildings face the street on that side.
- **Footprint** = `ceil(bbox - 0.15)` per axis in tiles, native model size, no scaling. Exceptions are listed in `models.json` (`scale`, `note`).
- Node scales to bake into geometry before instancing: `industrial/water-tower`, `industrial/detail-tank`, `industrial/shipping-container-a/b/c`.
- Textures: each pack needs `Textures/colormap.png` next to its `.glb` files (external URI). The suburban zip ships no `colormap.png` in `GLB format/`; copy it from `FBX format/Textures/`. Layout used: `models/<pack>/*.glb` + `models/<pack>/Textures/colormap.png`.

## Roads (exits at rotation 0)

| Piece | Exits | Use |
|---|---|---|
| `road-straight` | -X, +X | straight |
| `road-bend` | -X, +Z | corner |
| `road-intersection` | -X, +X, +Z | T junction (stem +Z) |
| `road-crossroad` | all four | 4-way |
| `road-end` | +X | dead end |
| `road-square` | none | isolated tile |
| `road-crossing` | -X, +X | zebra crossing, in the MVP |
| `road-roundabout` | all four (assumed) | 3x3, in the MVP |

These pieces cover the 16 neighbour masks by rotation. Excluded: barrier, line, path, sidewalk, square, curve, split, slant and bridge variants, and every prop (lights, signs, poles, cones).

## Buildings

| Role | Pack / models | Footprint |
|---|---|---|
| Shop | commercial a, b, c, d, f, g, h | 1x1 |
| Market | commercial e, k | 2x1 |
| Shop (high tier) | commercial i, l, m, scaled x1.5 | 2x2 |
| Tower | commercial skyscraper a to e | 2x2 |
| Home tier 1 | suburban k, l, r | 1x1 |
| Home tier 2 | suburban h, i, q, p | 2x1 |
| Home tier 3 | suburban a, c, e, o, j, g | 2x1 |
| Home tier 4 | suburban b, d, s, u | 2x1 |
| Home tier 5 | suburban f, m, t | 2x2 |
| Home tier 6 | suburban n | 2x2 |
| Factory, Workshop, Packhouse | managed `factory-*`, `workshop-*`, `packhouse-*`, four colors each (`-tone-a` to `-tone-d`) | 2x2 |
| Storehouse | managed `storehouse-2x2-t1` to `t10`, four colors each | 2x2 |
| Material depot | managed `depot-2x1-t1` to `t6`, four colors each | 2x1 |
| Vault | managed `vault-2x1-t1` to `t6`, four colors each | 2x1 |
| Grain silo | managed `silo-2x2-t1` to `t10`, four colors each | 2x2 |
| Water tower tiers 1–3 | managed `watertower-1x1-t1` to `t3`, four colors each | 1x1 |
| Hydro power plant | managed `hydro-1x2-t1` to `t3`, four colors each | 1x2 |
| Wind turbine, geothermal and coal power plants | managed `windturbine-1x1`, `geothermal-1x1`, `coal-1x1` (Tiers 1–3, 1–3, 1–4), four colors each | 1x1 |
| Backup power plant, Neighborhood battery | managed `backup-2x2-t1` (to `t3`, reserved), `battery-1x1` | 2x2 / 1x1 |
| Solar installation | managed `solar-2x2-t1` to `t4`, reserved (the game still binds the Kenney panel group) | 2x2 |
| Bus stop, BRT station, Railway station | managed `stop-1x1-bus`, `stop-1x1-brt`, `station-2x1` | 1x1 / 2x1 |

Not in the MVP: commercial `building-j` (5.2k tris) and `building-n` (3x2); all `detail-*`, fences, paths, driveways, planters, trees, chimneys, tanks, containers, single solar panels and `windmill-low` (decor, after MVP). `commercial/low-detail-*` are LOD only.

## Open

- Roundabout exits are assumed at the middle of each side; verify before use.
- Role names are placeholders for the economy and tiers decided in later tickets.
