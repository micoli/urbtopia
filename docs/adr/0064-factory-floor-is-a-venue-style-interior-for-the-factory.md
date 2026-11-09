---
status: accepted
---

# The Factory gets a Factory floor: a Venue-style interior that boosts production

Extends [ADR 0020](0020-venue-interior-scene-and-aggregate-simulation.md) to one Production building, the Factory. The Factory keeps its Slots, Tiers and Jobs. It gains an optional interior, the Factory floor, where the player places a Motor, Gears, Shafts, a Pump, Pipes and Machines to raise the speed and yield of its Slots.

## Decisions

- **Not a Venue.** A Venue earns Urbs from Visitors. A Factory floor earns nothing: it makes the Factory produce faster and richer. Takings, Visitors, Rank and events do not apply, and the strongest Machines are gated by the Factory's Tier. The Factory stays a Production building.
- **Same scene, same Fixtures.** The Management view, the isometric grid sized by Tier, Fixtures with a Condition, Repair and a Technician are those of ADR 0020. Fixtures are data (`assets/defs/fixtures`), the rules are code keyed by type.
- **The layout is the puzzle.** There is no separate puzzle screen. Gears and Pipes form networks on the grid; a Machine is Linked when it receives the Drive and the Flow it needs, in the direction it needs. Two meshed Gears turn opposite ways, so the parity of the chain is the difficulty. Links are a graph computed from grid adjacency, never a pathfinding of people.
- **A bonus, not a requirement.** An empty floor leaves the Factory exactly as it is today, so existing saves and balance do not move. The bonus (speed and yield) is capped, and the cap grows with the Factory's Tier, so upgrading the Factory stays worth it. Figures live in `assets/defs/balance/`.
- **Wear and breakdown.** Gears and Pipes wear; a broken one unlinks what lies downstream. Breakdowns are drawn from the floor's own stream of the game's Seed, at game-hour boundaries, so Catch-up and reloading give the same result.
- **Staff.** The Factory keeps its Jobs by Tier. One role is added, the Technician, hired with a one-off fee and a daily wage, which repairs on its own. The Fill rate of [ADR 0061](0061-venue-staff-counts-in-proportion-to-its-fill-rate.md) does not apply to it ([ADR 0065](0065-factory-floor-technician-always-works.md)).
- **Saved state.** The list of Fixtures (type, position, rotation, Condition), the Technician and the Seed stream. Links, bonus and silhouettes are rebuilt on load. An older save loads with an empty floor.

## Why

The interior grid gives the player a spatial decision that the queue of Slots alone does not: layout is the lever, as in the Arcade. A Factory is the building with the longest progression (five Tiers), so a late-game reward for fitting it out fits its role. Keeping the Factory a Production building leaves its glossary meaning, its Slots and its saves untouched.

## Considered options

- **Make the Factory a Venue.** Rejected: it would stretch the definition of a Venue (Takings, Visitors) to a building that has neither.
- **Separate Puzzle screens for gears and pipes, with a Stake-like Round.** Rejected: it reuses the Casino's vocabulary, which ADR 0020 forbids for Venues, and adds a second game loop; the room itself is the puzzle.
- **A hard requirement (no Link, no production).** Rejected: it would break every existing Factory and its balance.
- **Every Production building gets a floor.** Rejected for now: the Factory first, extensible by data to the others.

## Consequences

- The save envelope grows a floor list and a Seed stream, hence a version bump and a migration.
- The Factory side panel opens a Management view; the Takings section is hidden for it.
- Fixture models (Motor, Gears, Shafts, Pump, Pipes, Machines) have to be drawn, one by one, in Blender.
