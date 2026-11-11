---
status: accepted
---

# The Packhouse gets a Packhouse floor: the Factory floor engine plus a Line network

Extends [ADR 0064](0064-factory-floor-is-a-venue-style-interior-for-the-factory.md), which left "every Production building gets a floor" as extensible by data. The Packhouse is the second building to get one. It keeps its Slots, Tiers and Jobs and gains an optional interior where the player places a Motor, Gears, Shafts, a Packer, Conveyors, Strappers, Scanners and Exits to raise the speed and yield of its Slots.

## Decisions

- **Not a Venue.** Same as the Factory floor: no Takings, Visitors, Rank or events. The Packhouse stays a Production building.
- **Same engine, a third network.** Drive (Motor, Gears, Shafts, Bevels) is the Factory floor's. The new **Line** carries Packets in one direction from a Packer, through Conveyors, Strappers and Scanners, to an Exit. Conveyors need no Drive; Packer and Strapper do. A Machine is Linked when its Drive arrives and its Line is unbroken.
- **Conveyor T merges, elbows turn.** The T has two entries and one exit; there is no split. A separate elbow turns a Line a quarter turn, in a left and a right version because a rotation cannot turn one into the other.
- **Walls.** The Packer hangs on the back wall only, an Exit on any wall; neither takes a floor tile. Placement reuses the wall mounting of the Home interior.
- **Exits sort by size.** Each Exit serves Crate, Box or Pallet; a Slot's bonus counts only if an Exit of its size is Linked. Exits are limited by Tier (1, 1, 2, 2, 3).
- **A bonus, not a requirement.** An empty floor leaves the Packhouse as it is. Speed and yield caps grow with the Tier; figures live in a balance file of their own beside `factoryFloor.json`.
- **Scanner and variety.** A Scanner halves the wear downstream of it. Each Strapper beyond the first on a Line adds a small yield, within the Tier cap.
- **Packets are a picture.** They are animated on the Line and never counted: there is no throughput. The truck at an Exit is visual and never saved.
- **Wear and Technician.** Wear, breakdowns downstream and the always-working Technician follow ADR 0064 and [ADR 0065](0065-factory-floor-technician-always-works.md), with the same posts by Tier. The Jobs of the Packhouse (5 per Tier) stay separate from the Technician.
- **Saved state.** The Fixtures under the same `floor` field as the Factory and the Home. An older Packhouse loads with an empty floor.

## Why

The Packhouse is the only way to sell a Harvest, so every farmer passes through it; a floor gives that stop a spatial lever. Reusing the Factory floor engine and its saves keeps the cost to one new network and a few Fixtures. Pictured packets avoid a flow simulation the bonus does not need.

## Considered options

- **Make the Packhouse a Venue.** Rejected: it has no Visitors; same reasoning as ADR 0064.
- **Count Packets and cap by throughput.** Rejected for now: it adds a second simulation for little decision.
- **A splitting T.** Rejected: it needs an alternation rule.
- **No elbow, the T as corner.** Rejected after the first models: an elbow reads better and costs one extra Fixture.
- **Fold the Line into Flow.** Rejected: Flow is a liquid network with Tanks and Vats; mixing the rules would blur both.

## Consequences

- Floors become a third kind, `packhouse`, next to `factory` and `home`: floor commands, grid size, persistence validation and the side panel button extend to it.
- Nine models have to be drawn, one by one in Blender: Packer, straight Conveyor, T Conveyor, left and right elbow Conveyors, Strapper, Exit, Scanner and the truck.
