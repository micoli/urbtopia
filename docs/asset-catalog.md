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
| Factory | industrial b, e, f, g, l, m, n, r, t, c | 1x2 to 3x2 |
| Storehouse | industrial a, p, s, q | 2x1 to 2x2 |
| Workshop | industrial h, i, j, k, o, d | 2x2, 1x2 or 2x1 |
| Water tower | industrial water-tower | 1x1 |
| Power plant, small | industrial windmill | 1x1 |
| Power plant, medium | industrial solar-panel groups | 2x1 / 1x2 |

Not in the MVP: commercial `building-j` (5.2k tris) and `building-n` (3x2); all `detail-*`, fences, paths, driveways, planters, trees, chimneys, tanks, containers, single solar panels and `windmill-low` (decor, after MVP). `commercial/low-detail-*` are LOD only.

## Open

- Large power plant: pick the chimney factory among the Factory models.
- Roundabout exits are assumed at the middle of each side; verify before use.
- Role names are placeholders for the economy and tiers decided in later tickets.
