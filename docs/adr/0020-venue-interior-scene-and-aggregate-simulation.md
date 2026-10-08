# A Venue is managed in a separate interior scene, simulated in aggregate

Accepted. A Venue (Arcade, Supermarket, Hotel) is a placed building whose side panel opens a Management view: an isometric interior grid where the player places Fixtures and hires Staff. The grid is real, the economy is not: the Venue is simulated in aggregate per game tick, and only the layout, the Staff, the Condition of each Fixture and the Takings are saved.

## Decisions

- **Interior scene.** The Management view is its own plain three.js scene, with its own orthographic camera and a grid sized by the Venue's Tier, shown instead of the city while it is open ([ADR 0001](0001-imperative-three-chunked-instancing.md)). React owns only the panels and menus. The city scene is paused, not destroyed. The interior reuses the same model library and model definitions ([ADR 0012](0012-models-json-single-source-of-model-definitions.md)).
- **Pure core, no agents.** Takings are `Visitors × service rate × price`, limited by the Fixtures and the Staff and modulated by quality. Adjacency (counter near the entrance, noise between neighbouring machines, table and chair pairs) is computed from grid distances, never from a pathfinding of simulated people. Visitors are a number; the silhouettes shown in the interior are a projection, never saved, like Vehicles. The simulation runs on the injected clock, so Catch-up replays it ([ADR 0002](0002-pure-core-injected-clock-replay-catch-up.md)).
- **Saved state.** Per Venue: the list of Fixtures (type, grid position, rotation, Condition), the Staff by role, the Takings and a dedicated stream of the game's Seed for breakdowns, advanced as in [ADR 0010](0010-seeded-casino-draws-advanced-at-stake.md). It is a list, never a per-cell grid; occupancy, performance and Visitors are rebuilt on load ([ADR 0003](0003-localstorage-versioned-save-envelope.md)). Older saves load with no Venue.
- **Data, not code, per Venue type.** The Venue itself is an entry of `assets/buildings.json` ([ADR 0014](0014-all-buildings-defined-in-buildings-json.md)). Its Fixture catalogue (id, model key, footprint, price, minimum Venue Tier) is data too; rules (revenue pipeline, adjacency, wages, wear) stay in code keyed by Venue type. Supermarket and Hotel are therefore added as data and rules on the same scene and the same state shape, with no new architecture.
- **Not a Casino.** A Venue never reuses Minigames, Stakes or Rounds, and a Casino is never made a Venue. The Casino stays a Leisure building where the player plays; the Venue is where the player manages.

## Why

The interior grid is what makes the Management view a game rather than a spreadsheet: layout is the player's lever on flow and queues. Keeping the economy aggregate keeps the model testable, deterministic and compatible with Catch-up, and avoids the per-individual simulation the glossary already rules out ([CONTEXT.md](../../CONTEXT.md), Commute).

## Considered options

- **A list of Slots instead of a grid** (as for production): trivial to build and to save, but position then means nothing and the Management view has no spatial decision. Rejected for the Arcade; the cost is a second scene.
- **Live simulated customers in the interior**: prettier, but it needs pathfinding and per-Visitor state, cannot be replayed by Catch-up cheaply and cannot be saved. Rejected; silhouettes are drawn from the aggregate.
- **Extending the Casino into a general venue**: would blur Stake and Minigame vocabulary and tie every Venue to chance and a bankroll. Rejected.

## Consequences

- A second scene to maintain, with its own picking, camera and disposal; the city scene must pause cleanly and resume.
- The save envelope grows a Venue list and a PRNG stream, hence a version bump and a migration.
- Fixture models come from the Kenney packs Mini Arcade, Mini Market and Furniture Kit (CC0, kept in `assets/kenney/`). They have no billiard table, so it comes from Poly Pizza ("Pool Table" by Evol-Love, https://poly.pizza/m/7GzmqI1M0fC, CC-BY 3.0): its attribution must stay in the credits like the other Poly Pizza models.
