---
status: accepted
---

# The Packhouse gets a Packhouse floor: the Factory floor engine plus a Line network

> Renamed: what this ADR calls the Factory floor or the Packhouse floor is now the Factory interior or the Packhouse interior ([ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md)).

Extends [ADR 0064](0064-factory-floor-is-a-venue-style-interior-for-the-factory.md), which left "every Production building gets a floor" as extensible by data. The Packhouse is the second building to get one. It keeps its Slots, Tiers and Jobs and gains an optional interior where the player places a Motor, Gears, Shafts, a Packer, Conveyors, Strappers, Scanners and Exits to raise the speed and yield of its Slots.

## Decisions

- **Not a Venue.** Same as the Factory floor: no Takings, Visitors, Rank or events. The Packhouse stays a Production building.
- **Same engine, a third network.** Drive (Motor, Gears, Shafts, Bevels) is the Factory floor's. The new **Line** carries Packets in one direction from a Packer, through Conveyors, Strappers and Scanners, to an Exit. Conveyors need no Drive; Packer and Strapper do. A Machine is Linked when its Drive arrives and its Line is unbroken.
- **Conveyor T merges or splits, elbows turn.** A merging T has two entries and one exit, the entries being the two sides or the back and one side. A splitting T has one entry and two exits, to both sides or straight on and to one side; Packets take the exits in turn, which is only a picture since they are never counted. An elbow turns a Line a quarter turn. The elbows, the one-sided splitters and the one-sided mergers come in a left and a right version because a rotation cannot turn one into the other.
- **Edges.** The Packer stands on the tile along the back wall only, an Exit on the tile along any edge of the floor, each with its back to the edge and turned that way by itself when put on the cell. They are ordinary Fixtures with a placement rule, not wall-hung ones: their belts fill the tile, so the first Conveyor starts on the next one.
- **Exits sort by size.** Each Exit serves Crate, Box or Pallet, as three Fixtures of their own told apart by a tint; a Slot's bonus counts only if an Exit of its size is Linked. Exits are limited by Tier (1, 1, 2, 2, 3) for each size, so a floor has up to nine at the top.
- **A bonus, not a requirement.** An empty floor leaves the Packhouse as it is. Speed and yield caps grow with the Tier; figures live in a balance file of their own beside `factoryFloor.json`.
- **Scanner and variety.** A Scanner halves the wear downstream of it. Each Strapper beyond the first on a Line adds a small yield, within the Tier cap.
- **Packets are a picture.** There is no throughput. The truck at a Linked Exit is visual and never saved.
- **Power.** The Motors of a Packhouse floor draw power from the city as a Factory's do (all of it when the Machines they drive run, a share at rest), whether or not an Exit is linked. A Packhouse with no Motor draws none, and one whose Motors are short of power slows like a Factory.
- **Wear and Technician.** Wear, breakdowns downstream and the always-working Technician follow ADR 0064 and [ADR 0065](0065-factory-floor-technician-always-works.md), with the same posts by Tier. The Jobs of the Packhouse (5 per Tier) stay separate from the Technician.
- **Saved state.** The Fixtures under the same `floor` field as the Factory and the Home. An older Packhouse loads with an empty floor.

## Why

The Packhouse is the only way to sell a Harvest, so every farmer passes through it; a floor gives that stop a spatial lever. Reusing the Factory floor engine and its saves keeps the cost to one new network and a few Fixtures. Pictured packets avoid a flow simulation the bonus does not need.

## Considered options

- **Make the Packhouse a Venue.** Rejected: it has no Visitors; same reasoning as ADR 0064.
- **Count Packets and cap by throughput.** Rejected for now: it adds a second simulation for little decision.
- **No splitting T.** Rejected once Packets became a picture: alternating them between exits is then only an animation.
- **No elbow, the T as corner.** Rejected after the first models: an elbow reads better and costs one extra Fixture.
- **Fold the Line into Flow.** Rejected: Flow is a liquid network with Tanks and Vats; mixing the rules would blur both.

## Consequences

- Floors become a third kind, `packhouse`, next to `factory` and `home`: floor commands, grid size, persistence validation and the side panel button extend to it.
- Nine models have to be drawn, one by one in Blender: Packer, straight Conveyor, T Conveyor, left and right elbow Conveyors, Strapper, Exit, Scanner and the truck.
