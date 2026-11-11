---
status: accepted
---

# Interiors come in three families: Venue, Production interior and Service interior

Extends [ADR 0020](0020-venue-interior-scene-and-aggregate-simulation.md), [ADR 0064](0064-factory-floor-is-a-venue-style-interior-for-the-factory.md) and [ADR 0066](0066-home-interior-is-a-furnishable-sample-dwelling-that-only-adds-comfort.md). The Factory floor and the Packhouse floor are renamed Factory interior and Packhouse interior: the word "floor" is gone from the vocabulary, the physical floor tile of a room excepted.

## Decisions

- **Three families on one engine.** A **Venue** earns Urbs from Visitors (Arcade, Supermarket, Hotel, Restaurant). A **Production interior** raises what a Production building or a Storehouse makes or holds. A **Service interior** raises the quality of a Public facility. All share the Management view, the isometric grid sized by Tier, Fixtures, Staff and the simulation in aggregate. Only a Venue has Takings, Visitors, Rank and events. The Home interior stays a fourth case that only adds Comfort ([ADR 0066](0066-home-interior-is-a-furnishable-sample-dwelling-that-only-adds-comfort.md)).
- **First waves.** Production interiors: Mill, Bakery, Dairy, Storehouse (the Factory and the Packhouse exist). Service interiors: School, Library, Hospital. The Workshop, Textile mill, Knitwear factory, Livestock farm, Shop, Theater, Concert hall, Town hall, Police station and Fire station get none for now. The Shop overlaps the Supermarket, the Theaters are Arenas that live on their Gatherings.
- **No new puzzle mechanic.** Each Production interior reuses the Link engine of the Factory interior: the Mill turns on Drive alone, the Dairy on Flow, the Bakery on both. The Bakery, the Dairy and the Storehouse also get an assembly line (a Line of Packets, [ADR 0068](0068-packhouse-floor-reuses-the-factory-floor-engine-with-a-line-network.md)) that carries what they work from an entry to the Staff at the end. The Mill gets none, and a Factory line is decided later.
- **Levers.** Mill: speed. Bakery: speed, and the sales rate of the Counter it already has. Dairy: yield of Cheese and of Cream. Storehouse: capacity. School and Library: the share of Knowledge they give. Hospital: the Well-being its Health coverage gives. Reach and capacity of a Public facility never change.
- **Invariants of the families.** An empty interior leaves the building exactly as it was. The bonus is capped by the Tier. Breakdowns are drawn from the interior's own stream of the game's Seed. The save holds the list of Fixtures and the Staff, never Links, bonus or silhouettes. Each family sits behind a feature flag (`productionInterior`, `serviceInterior`) and unlocks at a Citizen threshold.
- **Service interiors do not wear.** Their Fixtures have no Condition and no Technician: the wages are their running cost.

## Why

The three families keep the word Venue strict, which the glossary already protects, and let a new building reuse an existing engine by data. The player's lever stays the layout, as in the Arcade and the Factory.

## Considered options

- **Make every interior a Venue.** Rejected: it would give Takings and Visitors to buildings that have neither.
- **A new puzzle mechanic per building.** Rejected: more code and more balance for little new play.
- **Interiors for every Public facility at once.** Rejected: School, Library and Hospital first, to validate the family.
- **A flag per building.** Rejected: the buildings of a family share their code.

## Consequences

- Save version 19 moves `Building.floor` to `Building.interior`.
- `CONTEXT.md` gains Production interior and Service interior, and "Public facility" gains the wages of its Staff ([ADR 0072](0072-public-facilities-pay-the-wages-of-their-service-interior-staff.md)).
- The Blender models and the Guide, tutorial and codex pages of each family come with its first interior (Mill, School).
