# Factory floor

Status: in progress

Decisions from the grilling session. Vocabulary in `CONTEXT.md` (Factory floor, Machine, Drive, Flow, Link). Rationale in ADR-0064.

## Rules
- Only the `factory` building gets a Factory floor (not the Bakery, Dairy, Knitwear factory, nor the Workshops). Extensible by data later.
- It is not a Venue: no Takings, Visitors, Rank, events, Minigames. Same Management view, grid by Tier, Fixtures, Condition, Repair.
- Optional: an empty floor leaves the Factory exactly as it is. The bonus (speed and yield of the Slots) is capped by the Factory's Tier (`assets/defs/balance/factoryFloor.json`).
- Fixtures: Motor, Gear, Shaft (Drive); Pump, Pipe, Elbow, Tee (Flow); Press, Mixing vat, Lathe (clockwise or counter-clockwise), Boiler (Machines); Wall. Defs in `assets/defs/fixtures/factory*.json`, models in `assets/managed-models/factory-floor/`.
- A Machine is Linked when it receives every Drive (in its direction, for a Lathe) and every Flow it needs. A broken Fixture cuts what is downstream. Meshed Gears reverse the turn; a group fed both ways jams.
- Staff: the Factory keeps its Jobs; one role added, the Technician (hire fee, daily wage, Fill rate of ADR-0061).
- Saved: Fixtures (type, position, rotation, Condition), Technician, Seed stream. Links and bonus rebuilt on load. Old saves load with an empty floor.
- Wear and breakdowns at game-hour boundaries, from the floor's own Seed stream.
- Walls stand at half height; the scene turns odd-parity Gears by half a tooth so neighbours mesh.

## Delivery order
1. Data and pure core (models, Fixture defs, schema, Links, bonus). Done, see issue 01.
2. State, commands, save and Catch-up.
3. Bonus applied to the Slots of the Factory.
4. Management view of a Factory (scene, side panel, i18n).
5. Technician, wear, Repair.
6. Tutorial, guide, codex.
