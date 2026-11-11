---
status: accepted
---

# A Restocker restarts the production of an Exit's Line and stores it

> Renamed: what this ADR calls the Factory floor or the Packhouse floor is now the Factory interior or the Packhouse interior ([ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md)).

Amends [ADR 0068](0068-packhouse-floor-reuses-the-factory-floor-engine-with-a-line-network.md) and follows [ADR 0065](0065-factory-floor-technician-always-works.md). The Packhouse floor gains a second worker, the Restocker, who spares the player the manual queueing and collecting of a Good they pack all the time.

## Decisions

- **A Packhouse-only worker, held like the Technician.** Hired from the Packhouse floor for a fee of five days of wages, then paid a daily wage (28 Urbs, key `restocker`). The posts follow the Tier (`restockerPosts`: 0, 1, 1, 2, 3). He is not one of the Packhouse's Jobs and always works, as the Technician does; with no Urbs left for the wage he does not work.
- **Assigned by hand to an Exit.** A Line has no identity of its own, so the Restock (the packed Good, of the Exit's size and already unlocked, that the Line restarts) and the assignment sit on the Exit. Assigning needs a free hired Restocker; unassigning frees him, still paid, and stops the restart without touching what is running.
- **Three conditions.** The Exit has a Restock, a Restocker is assigned, and the Line is Linked. A break or a worn Fixture pauses him; the assignment stays and he resumes on Repair. Selling or moving the Exit frees him.
- **One entry per Line.** The Restocker keeps at most one entry of his Good in the queue, waiting, running or done. When it finishes he sends it to the Storehouse and queues the next, taking the ingredients from the Storehouse as a manual queue would. He never touches another's entry.
- **Fair turns on a contested Slot.** The queue is single and serial and limited by the Slots, so when a Slot frees, the waiting Restockers are served oldest restart first, then by Exit id. The last free Slot is never taken: it stays for the player. Lines beyond what the Slots allow wait, and the Exit says so.
- **Blocks wait, never fail.** A missing ingredient, no free Slot or a full Storehouse (the finished entry stays done, with the existing `StorageFull`) holds the restart without losing the assignment; it resumes by itself.
- **Replayed by Catch-up.** He acts at the finish time of each production inside the production advance, so offline time gives the same result. The wage is by the hour, like the Technician's.
- **Saved state.** `floor.restockers` counts those hired; each Exit holds `restock` and `restockerAssigned`. A Packhouse saved before loads with none. The Factory floor is untouched.

## Why

A Packhouse is a loop the player repeats: queue, wait, collect. The Restocker makes it a lever of the floor (Tier posts, wage, one per Line) instead of a free auto-repeat, and the manual assignment lets the player switch the mechanism off. A fixed quota per Line and a reserved Slot keep one Line from starving the others or the player.

## Considered options

- **Assign Restockers automatically.** Rejected: the player could not disengage the mechanism.
- **Fill every free Slot.** Rejected: it would eat the player's queue and let one Line starve the rest.
- **Restart with a checkbox and no worker.** Rejected: no cost, no Tier gate, nothing to decide.
- **Count the Restocker in the Packhouse's Jobs.** Rejected for the reasons of ADR 0065.

## Consequences

- The Exit's side panel gains a Restock choice and a Restocker assignment, and the Packhouse floor panel a hire/release control next to the Technician's.
- `packhouseFloor.json` gains `restockerPosts`; `venues.json` gains the `restocker` wage; the persistence validation accepts the new fields.
- The production advance gains a restart-and-store step for assigned Exits, which Catch-up replays.
