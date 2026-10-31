---
status: accepted
---

# Pirate coves are Arenas seated by separate Stands

A Pirate cove looks like an Attraction: it is a themed place on the water that Tourists come to. We made it an Arena: it earns only from its Shows, and with none it draws nobody and earns nothing. Its capacity is not a figure of the building either: the seats live in Stands, separate buildings the player places on the shore, each belonging to one Pirate cove and saved with that link.

## Why

- Attraction and Arena at once, like the Colosseum, was rejected: ADR 0053 keeps that as a single deliberate exception, and Stands would have no clear meaning for visits all day long.
- A capacity per Tier inside the building, as in the Concert hall, was rejected: the crowd facing the water is the point of the building, and the shore length becomes a real constraint.
- Counting every Stands on the same connected water for each Pirate cove was rejected: two Pirate coves could sell the same seats. Picking the nearest Pirate cove each time without saving it was rejected too: placing a new Pirate cove would silently move seats away from the first one.
- Unlimited seats were rejected: Tourists follow capacity, so sales would grow without bound. The Tier of the Pirate cove caps the seats that count, at 400, 800 and 1,200.

## Consequences

- The save format gains the link from Stands to their Pirate cove, a Pirate ship family and the title of a Show. Older saves hold none of them and stay valid.
- A Pirate cove with Pirate ships or Stands cannot be removed, and removing water or laying scenery cannot cut Stands off it.
- A Show's figures are fixed when it is programmed, so its Pirate ships and Stands cannot be sold until it is settled or cancelled.
- The Pirate ship limit of one per 12 navigable Water tiles belongs to the connected water, not to a Pirate cove: a second Pirate cove on the same water adds no room for ships.
- The Colosseum remains the only building that is both an Attraction and an Arena.
