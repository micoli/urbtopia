---
status: accepted
---

# Livestock Pens are fed by a Line and worked by a herder

Extends [ADR 0074](0074-mill-staff-is-assigned-to-a-millstone-and-the-pipes-carry-the-grain.md) and [ADR 0073](0073-bakery-staff-is-assigned-to-an-oven-or-a-display-counter.md) to the Livestock farm.

## Decisions

- **A Line from the silo to the Collection exit.** A Motor drives a Feed intake against the back wall, which pours the grain of the silo on Conveyors to a **Feeder**, which feeds the **Pen** in front of it; the Pen sends its production to a **Packer** (driven by a Motor, with its Drive on the right or on the left), then Conveyors carry the packets to a **Collection exit** (`line` and `autoWork` in `interiors.json`). There is no Flow. The Feeder, the Pen and the Packer are links of the Line, so the Pen is `lined` only when the Line goes on to a Collection exit.
- **The animal is picked on the Pen**, which holds a Recipe (an item an animal gives: an egg, milk, wool or silk) as the Extractor of a Workshop does (`picks`).
- **A herder is assigned to a Collection exit**, one to one, as a restocker is to a Storage bin. He works on the item picked on the Pen upstream, keeps one production of it in the queue and stores each finished one in the Storehouse. Without a Pen with an animal upstream he has nothing to work on.
- **Yield only.** Each Collection exit that the Line reaches adds yield to the farm, saturating towards the cap of the Tier, and the herders hired deliver it (the part `yield`). The farm gets no speed.
- **Posts and room.** 1, 2, 3, 4 and 5 herders by Tier, and as many Collection exits as the farm has production Slots.
- **Saved games.** A herder once assigned to a Pen is ignored: the assignment has no meaning on a Pen any more. A farm built without a Packer or a Collection exit produces nothing until the player adds them.
- **Animals ×1.6.** The animal of a Pen is drawn at 1.6 times its size in the interior, standing on the litter, because the animal models are small next to a one-tile Pen.

## Why

The Livestock farm was the last production building with no interior. Its Pens already exist outside; inside, the player decides which animal each Pen holds and how the grain reaches it, and a herder works on his own like the other producers.
