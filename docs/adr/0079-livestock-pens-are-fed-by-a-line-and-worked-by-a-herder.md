---
status: accepted
---

# Livestock Pens are fed by a Line and worked by a herder

Extends [ADR 0074](0074-mill-staff-is-assigned-to-a-millstone-and-the-pipes-carry-the-grain.md) and [ADR 0073](0073-bakery-staff-is-assigned-to-an-oven-or-a-display-counter.md) to the Livestock farm.

## Decisions

- **A feeding Line.** A Motor drives a Feed intake against the back wall, which pours the grain of the silo on Conveyors that end in Exits: **Feeders** and **Collection exits** (`line` and `autoWork` in `interiors.json`). There is no Flow.
- **A Pen is fed beside a Feeder.** A Pen works when it has a Recipe (an item an animal gives: an egg, milk, wool or silk) and stands next to a Feeder that the Line reaches. Such a Pen is `lined`, and the assistants engine works on `lined` Fixtures as elsewhere.
- **A herder is assigned to a Pen**, one to one, as a baker is to an Oven. The herder keeps one production of that Recipe in the queue and stores each finished one in the Storehouse.
- **Yield only.** Each Collection exit that the Line reaches adds yield to the farm, saturating towards the cap of the Tier, and the herders hired deliver it (the part `yield`). The farm gets no speed.
- **Posts and room.** 1, 2, 3, 4 and 5 herders by Tier, and as many Pens as the farm has production Slots.
- **Animals ×1.6.** The animal of a Pen is drawn at 1.6 times its size in the interior, standing on the litter, because the animal models are small next to a one-tile Pen.

## Why

The Livestock farm was the last production building with no interior. Its Pens already exist outside; inside, the player decides which animal each Pen holds and how the grain reaches it, and a herder works on his own like the other producers.
