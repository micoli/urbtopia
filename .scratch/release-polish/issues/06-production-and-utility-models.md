# Replace the production, storage, shop and utility models

Status: in progress
Blocked by: 01, 02, 03
Spec: ../spec.md

## Acceptance criteria

- [ ] Workshops, Factories, Packhouse, Farm, Storehouse, Material depot, Vault, Grain silo, Shops, Power plants and Water towers are rebuilt with the shared kit, keeping Model id and footprint.
- [ ] The Kenney `industrial` and `commercial` buildings (factories, warehouses, shops) are replaced too; the Kenney `suburban`, `pirate` and `holiday` buildings are covered by the other lots or replaced here.
- [ ] The Quaternius farm buildings and the remaining poly.pizza models used by Buildings are replaced and removed.
- [ ] Tiers stay distinct; Solar panels overlay still fits.
- [ ] No Building left that references a poly.pizza model or a Kenney `industrial`, `commercial`, `suburban`, `pirate` or `holiday` model (the Kenney Venue models excepted); `docs/asset-catalog.md` updated.
- [ ] Baselines updated and reviewed.

## Progress

Done, with the shared kit and four color tones each (one model, a palette PNG per other tone, Repaint swaps the palette, see ADR 0035): the five Shops, the Workshop, the Factory, the Packhouse, the Storehouse (ten Tiers), the Material depot, the Vault, the Grain silo (ten Tiers), the Wind turbine, the Geothermal, Coal and Hydro power plants and the Water tower. Without Tiers: the Backup power plant and the Neighborhood battery (models drawn, the battery bound), the bus stop, the BRT station and the Railway station, drawn and bound. The Solar installation and the Backup power plant Tiers 2 and 3 are drawn but kept `.reserved` because the game gives them no Tiers.

The Kenney industrial and commercial buildings used by these Buildings, the Quaternius silos and open barn, and the poly.pizza models they used have left the asset packs.

Deliberately left as is (owner's decision): the Farm keeps the Quaternius barn. The Water tower keeps its dark roof and orange hoops as drawn (roof and platform lightened to the mid grey).

Done in lot 05: the Hotel (three Tiers, four colors, mansard roof).

Status check (2026-10-17): no Building definition references a poly.pizza model or a Kenney `industrial` (except the Solar panel overlays), `commercial`, `pirate` or `holiday` model any more, apart from the decoration definitions `pirate-*`, `holiday-*` and the `suburban-tree-*` of `park` and `tree`, which belong to issue 11. 68 external models (51 poly.pizza, the Kenney `industrial` and `commercial` ones and others) remain in `assets/models.json` and `assets/` used by no Building: they still have to be removed, with their license entries, and `docs/asset-catalog.md` updated.

Left: removing those orphan models, binding the Solar installation and the Backup Tiers once the game defines them, an in-game check of orientation, size and Repaint of every new family (nothing was captured in the game yet), then the baselines.
