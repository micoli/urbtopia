# Venues (manageable buildings: Arcade, Supermarket, Hotel)

Status: ready-for-agent

Vocabulary and rules: `CONTEXT.md` (Venue, Management view, Fixture, Staff, Visitor, Condition, Repair, Takings). Architecture: ADR 0020.

## Scope
- New family: **Venue**, a building the player fits out and runs from the inside. Distinct from the Casino (no Minigames, no Stake) and from the Shop.
- Three types, delivered in order: **Arcade** (first, end to end), **Supermarket**, **Hotel**. After the Arcade, the others are data and rules on the same scene and state shape.
- The Venue is placed like any building, accepts Road and BRT access (ADR 0017), and unlocks by Citizens (Unlock). Thresholds are set at balancing time.
- The side panel of a placed Venue has a button that opens the **Management view**.

## Management view
- Own isometric three.js scene with a grid by Tier (Arcade: 6x6 / 8x8 / 10x10). The city scene is paused while it is open.
- A "Build" menu lists the Fixtures of the Venue type, locked below their minimum Venue Tier.
- Fixtures can be placed, moved, rotated by 90 degrees and removed; removing refunds 50% of the price. No Fixture upgrade: a better model is bought.
- A Staff section shows roles, posts, wages and hiring.

## Arcade
- Fixtures from the Kenney Mini Arcade pack: counter (cash-register), arcade machines (barrel climber, space shooter: recolors of `arcade-machine`), air hockey, pinball, claw machine, basketball game, dance machine, prize wheel, ticket machine, vending machine (snacks). Tables, chairs and bar stools from the Furniture Kit. Walls, floor, column and door from Mini Arcade shape the interior. `gambling-machine` is left out: it belongs to the Casino vocabulary.
- Billiard table: not in the Kenney packs. It uses the Poly Pizza model "Pool Table" by Evol-Love (https://poly.pizza/m/7GzmqI1M0fC, CC-BY 3.0, attribution required in the credits).
- Names are invented, never trademarked (naming rules).
- Adjacency (grid distances, no pathfinding): the counter near the entrance raises the service rate; two neighbouring loud machines lower attractiveness; a chair without a table is useless.
- Staff: manager (one post, unlocks pricing and events, small yield bonus), employee (serves the counter, sets the service rate), technician (repairs and slows wear), security (prevents incidents, which lose Visitors). Posts by Tier, daily wage in Urbs, filled by Citizens like Jobs.

## Economy
- Takings = Visitors x service rate x price, limited by Fixtures and Staff, modulated by quality; shown per Fixture ("this machine earns X per day").
- Arcade and Supermarket Visitors come from the Citizens around (position and access matter); the Hotel draws from outside, by the city's attractiveness.
- Takings are net of wages and Fixture upkeep, capped by Venue Tier, collected by hand like Tax (the Tax cap is `TAX.capHours`, 8 h). A Venue whose wages cannot be paid closes. No debt.
- Power Demand is moderate; a Venue is shed after the Casino. Not shed during an Adaptation period.

## Wear
- Each Fixture has a Condition that falls with use. Below a threshold it breaks down (drawn from the Venue's own Seed stream) and stops earning. It is repaired for Urbs, by the player or a Technician; a Repair always costs less than buying again. Nothing is discarded for wear.
- Scheduled events (tournament): the player pays an Urbs budget to multiply Visitors for a fixed duration.

## Persistence
- Saved per Venue: Fixtures (type, grid position, rotation, Condition), Staff by role, Takings, breakdown PRNG stream. Never saved: occupancy, performance, Visitors, silhouettes. Save version bumped; older saves load with no Venue.

## Out of scope for now
- Fixture upgrades, named individual Staff, live customer simulation, sound.
- Balancing numbers go in `.scratch/venues/balancing.md`.

## UI / content
- One React component per file. FR/EN strings in the existing i18n files. Codex entries for each Venue type. No Tutorial step.
