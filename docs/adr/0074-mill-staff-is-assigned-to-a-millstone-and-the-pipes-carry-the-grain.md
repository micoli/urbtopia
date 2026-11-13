---
status: accepted
---

# Mill staff is assigned to a Millstone, and the Pipes carry what it grinds

Extends [ADR 0073](0073-bakery-staff-is-assigned-to-an-oven-or-a-display-counter.md) to the Mill, with the Flow of the Factory in place of the Line.

## Decisions

- **The Millstone is the main piece.** The player chooses on each Millstone what it grinds: wheat for flour, olives for olive oil (its Recipe, chosen among what the Mill produces). A miller is assigned to a Millstone with a Recipe, one to one, as a baker is to an Oven; `autoWork` in `interiors.json` gives the Mill the generic engine, so the miller keeps one production of that Recipe in the queue and stores each finished one in the Storehouse. Without a miller assigned, the production is collected by hand, as before.
- **Pipes carry it, not a Line.** A Pump driven by a Motor pushes through Pipes, with no Tank: the Pump of a Mill is a source on its own. The Machines on the Pipes of one Pump are a **Cleaner** at the intake, the **Millstones**, and the output: a **Bagger** for flour, an **Oil tank** for olive oil. The Oil tank is a Machine here, not the source Tank of the Factory: the Mill's Tank is a destination.
- **Complete means worked.** A Millstone works when it is linked (Drive and Flow, as any Machine) and the Pipes of the Pump that feed it also reach a linked Cleaner and the destination of its Recipe (`milling` in `interiors.json`: `flour` to `bagger`, `oliveOil` to `oilTank`). Such a Millstone is `lined`, and the assistants engine works on `lined` Fixtures as it does for the Bakery and the Dairy. An incomplete schema stops the miller without losing the assignment.
- **Skin.** A miller is drawn as the plain worker used for Restockers, not the cook.
- **Posts.** A Mill has 1, 2, 3, 4 and 5 millers by Tier, enough for the Millstones it takes.
- **Side effect.** A Millstone now needs Flow, so a Mill with Millstones fitted before this change has none linked until a Pump, Pipes, a Cleaner and an output are added. The Mill is a recent interior behind the production flag.

## Why

The Mill was the one production interior where the player only placed a Motor and Millstones and hired a miller for a bonus. Giving the Millstone a choice, an assigned worker and an upstream and downstream, as in the Bakery and the Dairy, makes the interior a layout to solve, and the Pipes keep it different from the Lines of the others.
