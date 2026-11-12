---
status: accepted
---

# Bakery staff is assigned to an Oven or a Display counter

Refines [ADR 0071](0071-an-interior-role-carries-its-own-part-of-the-effect.md) for the Bakery, with the assignment of [ADR 0069](0069-a-restocker-restarts-the-production-of-an-exit-line-and-stores-it.md) as its model.

## Decisions

- **Assigned by hand, one to one.** A baker is assigned to an Oven, a seller to a Display counter. A Staff serves one Fixture and a Fixture has at most one Staff. The assignment sits on the Fixture, with its Recipe or its Sold Good; assigning needs one to be chosen first, and selling or moving the Fixture frees the Staff.
- **The effect follows the assignment.** An Oven adds its speed only to the productions of its Recipe, and only while a baker is assigned to it; a Display counter adds its sales rate only to the sales of its Sold Good, while a seller is assigned to it. The yield of the Display counters follows the same rule. A Staff hired and not assigned does nothing and is paid all the same.
- **They work on their own, like a Restocker.** A baker assigned to an Oven with a Recipe keeps one production of that Recipe in the queue, taking the ingredients from the Storehouse and storing each finished one there, as in [ADR 0069](0069-a-restocker-restarts-the-production-of-an-exit-line-and-stores-it.md): the Oven must be reached by the Line, the last free Slot stays for the player, a missing ingredient or a full Storehouse waits and never loses the assignment, and the Ovens served longest ago take the next free Slot. A seller assigned to a Display counter with a Sold Good pays out what the sold-out stacks earned and keeps a stack of that Good on the Counter, stocked from the Storehouse when it holds one, with as many stacks as Display counters sold that Good, up to the Slots of the Counter. Both run inside the production advance, so a long absence gives what the same time played would.
- **A Display counter sells what is baked upstream.** Its Sold Good is chosen among the Recipes of the Ovens that feed it through the Line. A Sold Good whose Oven is changed or cut off stays on the Fixture but adds nothing and is not stocked until an Oven upstream bakes it again.
- **One line for each Oven.** The baker of an Oven bakes on a line of its own, which only waits for the entries of that line; what the player queues keeps its own line. The lines share the pace of the Tier instead of each running at full speed: each line takes `1 + laneSlowdown × (other lines at work)` times as long (`laneSlowdown` is 0.5 in `interiors.json`), so three Ovens bake one and a half times what one does. This keeps the gain of a fitted Bakery bounded, as the Tier caps do for the other bonuses.
- **Everything else is as before.** Assigned Staff are Jobs of the Bakery and deliver their effect in proportion to the Fill rate (ADR 0071); wages and the hiring fee do not change. An interior with no assignment leaves the Bakery as it was: its productions and its sales run as before, with no bonus.
- **Posts follow the Slots.** A Bakery hires as many bakers as it has production Slots and as many sellers as its Counter has Slots, whatever its Tier, and the hiring panel shows `hired/posts` as a badge. The Tier posts of these two roles in `interiors.json` no longer set the number hired.
- **Limited by the Slots.** A Bakery takes as many Ovens as it has production Slots and as many Display counters as its Counter has Slots (`counterSlots` of its Tier: 3, 3, 4, 4, 5); the build menu shows `placed/allowed` on each and the item is disabled once full. Fixtures already placed beyond the limit stay, and no more can be added until the Slots allow it.
- **Bakery only.** The assignment is a generic engine; the Dairy and the Storehouse can use it later.

## Why

A single pool of bakers and sellers spread over the whole Bakery hides where the Line pays off. Assigning them to a Fixture, as Restockers are assigned to an Exit, gives each Oven and Display counter a reason to exist and lets the player decide which Good each one favours. The first version of this decision left the work to the player and only counted the speed per Recipe and the sales per Sold Good: the Bakery then started nothing by itself, which is not what "the same system as the Packhouse" means, so the Staff now work on their own.
