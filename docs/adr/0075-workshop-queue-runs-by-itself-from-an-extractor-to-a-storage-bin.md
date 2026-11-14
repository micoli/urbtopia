---
status: accepted
---

# The Workshop interior runs the queue by itself, from an Extractor to a Storage bin

Extends [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md), which left the Workshop without an interior, with the assignment of [ADR 0073](0073-bakery-staff-is-assigned-to-an-oven-or-a-display-counter.md) as its model.

## Decisions

- **No bonus.** The Workshop interior adds no speed and no yield (its caps are a token 1% that no Fixture feeds, and the Codex shows no benefit column). Its only gain is the **queue that runs by itself**.
- **A Line on Flow.** Pneumatic air comes from a Tank, a Pump and a Motor through Pipes, as in the Dairy. An **Extractor** stands against the back wall and takes the air on its left or its right (two Fixtures); a **Line** of Conveyors carries what it extracts through a **Cleaner**, also fed on its left or its right, to a **Storage bin**.
- **The item is picked on the Extractor** among the materials the Workshop produces (`picks` in the Fixture file). The Storage bin carries the item picked on the Extractor upstream of it, the lowest id first.
- **Staff: two kinds.** The **restocker** is assigned to a Storage bin, one to one, as a baker to an Oven; once the bin is reached by the Line and an item reaches it, he keeps one production of that item in the queue and stores each finished one in the Storehouse, with the rules of ADR 0069 (the last free Slot stays for the player, a full Storehouse waits). The **Technician** is the one of the other Production interiors. The restocker role carries the `restock` part, which no code reads: it gives no bonus.
- **Unlock and limits.** The interior opens at 50 Citizens behind the `productionInterior` flag. Bins are limited by the production Slots, like the Ovens.

## Why

The Workshop is the first building a player owns, and its queue is the one they tend by hand. A restocker that frees that queue is a lever of the room (a layout to solve, a wage to pay) without a second balance of speed and yield.

## Considered options

- **A speed bonus as in the Mill.** Rejected: the request was a gain in queue management only.
- **The item picked on the bin.** Rejected: the Extractor is the entry named after what it takes in.
