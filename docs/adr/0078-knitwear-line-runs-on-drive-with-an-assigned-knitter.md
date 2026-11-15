---
status: accepted
---

# The Knitwear Line runs on Drive, with a knitter assigned to a Knitter

Extends [ADR 0073](0073-bakery-staff-is-assigned-to-an-oven-or-a-display-counter.md) to the Knitwear factory, with a Drive in place of the Flow.

## Decisions

- **A Line like the Bakery's.** Pieces travel on Conveyors from a Knitter against the back wall, through a Finisher, to a Display counter (`feeds` in `interiors.json`: Knitter to Finisher, Finisher to Exit). Every Machine takes its Drive from a Motor through Shafts and Gears; there is no Flow, no Tank and no Pump.
- **The Knitter carries the Recipe.** The player chooses on each Knitter what it knits (a Good the factory produces, unlocked); a knitter is assigned to it, one to one, as a baker is to an Oven. The Finisher adds its speed to every Recipe, as the Mixer does, and no Staff serves it.
- **Sellers as in the Bakery.** A seller is assigned to a Display counter with a Sold Good that a Knitter upstream makes; the counter adds its sales and its yield to that Good alone.
- **Posts.** Knitters `0, 1, 1, 2, 2` and sellers `0, 1, 2, 3, 3` by Tier; one Knitter for each production Slot and one Display counter for each Counter Slot.
- **Skin.** A knitter is drawn as the cook of the Bakery, standing on the side of its Knitter that its Drive does not use.

## Why

The Knitwear factory was the one Line building that sells over its own counter and had no interior. Giving it the Bakery's structure keeps the interiors familiar, and the Drive keeps it different from the Bakery's gas.
