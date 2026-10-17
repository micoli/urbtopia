# Buildings share one art direction built from a shared module kit

Accepted. Extends [ADR 0012](0012-models-json-single-source-of-model-definitions.md) and [ADR 0022](0022-model-ids-decoupled-from-file-paths.md), which stay valid.

Every Building and every piece of decoration is modelled in the house `urbtopia` style: flat colors from one locked palette, built in Blender from a shared kit of modules (walls, roofs, windows, doors) so that proportions and details match from one Building to the next. The tool is a rework of the `create-building-model` skill specific to the game; its control render uses the target lighting, not the current one. Buildings are replaced by priority of visibility: Homes, Town hall, Public facilities, Casino and Venue exteriors, then production. The 172 nature and `mini-forest` decoration models (trees, rocks, platforms, tents) follow, because they stand next to the Buildings and in the Wild land scenery ([ADR 0033](0033-wild-land-scenery-derived-and-never-saved.md)).

After this, no Building or decoration depends on Kenney. Kenney stays only for the Venues (the `mini-arcade`, `mini-market` and furniture models, and the characters), and for vehicles, boats, roads and rails, which are small, repeated and seen from afar; Goods, Materials and Crops stay Quaternius. These kept assets are harmonised at runtime only. The poly.pizza models are removed from the game as their Building is replaced. A replaced model keeps its Model id, so saves are unaffected; a Model id is never renamed.

## Why

- The mix of Kenney, Quaternius, poly.pizza and hand-made models looks assembled. A palette alone does not fix it: shared modules do, because the mismatch is in proportions and detail density.
- A tree or a rock in another style stands out beside a house of the new style, and the Wild land scenery multiplies them. Vehicles, roads and rails do not: they are small and repeated, so their gain is low.
- The work stays bounded: about 60 to 70 Buildings, and a decoration set made from a few shared shapes (see issue 11), not 172 hand-made models.
- A single kit makes a new Building cheap to add and keeps it consistent.

## Consequences

- Real production effort (an estimated hour per Building), delivered by lots so that each lot is visible on its own.
- Pack licenses of the removed poly.pizza models leave the credits once none remain. The Kenney packs stay credited while vehicles, roads, rails, boats and Venues use them (CC0, no obligation, still a courtesy).
- Style drift is checked with the reference-scene screenshots of the visual baselines.
