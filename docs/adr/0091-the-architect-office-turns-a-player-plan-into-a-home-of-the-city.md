---
status: proposed
---

# The Architect office turns a player plan into a Home of the city

The player designs a house in a studio (walls, doors, windows, floors, balconies, roofs) and builds it like any other Home. The studio started as a throwaway prototype (`prototypes/architect-studio`); its code now lives in `src/architect`.

## Decisions

- **A building hosts the studio.** The Architect office is a building (`kind: architect`) built from the Build menu and unlocked at a Citizens threshold. Only one can be built, like the Town hall. It has five Tiers, bought like those of the Planning office. Its side panel and its floating button open the studio on a screen of its own, as the Planning office opens the District plan (ADR 0090). The prototype stays as a standalone entry that also imports and exports plans and GLB files; the game offers neither.
- **A plan is saved in the city.** Plans ride in the save envelope (ADR 0003), validated on load, never in the browser storage the prototype used. The save version goes up.
- **A plan is built as the Home type of its size, carrying its design.** The definitions hold one retired Home type per footprint (`housePlan-WxD`, 1×1 to 2×2). The Build menu lists the saved plans in the housing section; building one places the type of its size and stores the plan in the building (`design`), with the id of the saved plan (`design.planId`). Saving the plan again updates the design of every house built from it, so the houses follow the plan; a plan saved with a smaller footprint stays on the tiles of its house, while a save that would grow beyond the footprint of a house built from it is refused (save under another name). Deleting the plan detaches the houses, which keep their last design. The footprint and the price come from the plan. A house plan has one Tier, but a level of Home derived from its cells (32 habitable cells per level, a Brownstone floor) gives its Citizens, power and water Demand, Waste and Tax in the tables of the Homes (`homeLevelOf`).
- **A cell is a quarter of a tile on each side, a sixteenth of a tile in area.** A plan is at most 6×6 cells, so a house covers at most 2×2 tiles, like the Homes of the game: the footprint is its ground floor rounded up to whole tiles, and the house is drawn at a quarter of the size of the studio, with the same shape (`GAME_CELL_SIZE` and `CELLS_PER_TILE` go together).
- **The model is drawn in code.** The 3D house of a plan is built by the code of the studio (`buildHouse`), with the GLB slot models of `assets/managed-models/architect`, not by a GLB per plan. The scene builds it on demand and caches it by plan.
- **The Tier of the office gates the studio.** The Citizens threshold only unlocks the building. Its Tier unlocks the assets of the studio (bricks, roofs, dormers, chimneys, colour swatches, floors, footprint) and the number of plans the city can save. The tables are data, as for any Tier (ADR 0023). A Tier is never lost except by demolishing the office. Without an office, or with a lower Tier, a saved plan that uses locked assets opens read-only and cannot be built; the houses already built keep their design.
- **A house of a plan is drawn like the Homes of the game.** It uses the palette material of the game in flat shading, with the glass on the `glass` cell of the palette so that its windows light up at night (ADR 0050), not a coloured material per plan. It keeps the wall and roof colours of its plan and is not repainted. Proportions (floor height, wall thickness) are measured on the reference Homes of the `urbtopia` style.
- **The price comes from the plan.** The studio already prices bricks, cells, roofs, dormers and chimneys; the game takes that price as the cost of building the Home.

## Why

A catalogue fixed by export would make a plan buildable only after a developer adds files to the repository. A type per city lets every player build their own houses and keeps the simulation data-driven: the Home rules (Citizens, Demand, Tiers) apply unchanged to a type whose numbers come from a plan.

## Considered options

- **Export a GLB and a JSON definition per plan.** Rejected: nothing is buildable without a change to the repository.
- **A shared catalogue between cities.** Rejected for now: it needs an account and a server, and the game has none for gameplay data.
- **One cell per tile.** Rejected: a house would cover up to 6×6 tiles, far more than the Homes of the game. **Half a tile across.** Rejected after a trial: houses looked too big next to the Homes of the game, and covered up to 3×3 tiles.

## Consequences

- The definitions (`assets/defs`) stay static: retired `housePlan-WxD` types (1×1 to 3×3; only up to 2×2 are reachable now, the others stay so that older saves load), hidden from the Build menu and the codex, placed only with a design.
- The scene builds the house of a design on demand (`procedural/house-plan:<hash>`), shared by the equal plans.
- Tickets are in `.scratch/architect-office/`.
