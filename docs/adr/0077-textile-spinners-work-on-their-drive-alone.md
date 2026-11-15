---
status: accepted
---

# Textile Spinners work on their Drive alone

Extends [ADR 0074](0074-mill-staff-is-assigned-to-a-millstone-and-the-pipes-carry-the-grain.md) to the Textile mill, with neither Pipes nor a Line.

## Decisions

- **The Spinner is the only Machine.** The player chooses on each Spinner the fibre it spins (its Recipe, among what the Textile mill produces: wool, alpaca wool or silk). A spinner is assigned to a Spinner with a Recipe, one to one, as a miller is to a Millstone; `autoWork` in `interiors.json` gives the Textile mill the generic engine, so the spinner keeps one production of that Recipe in the queue and stores each finished one in the Storehouse.
- **Complete means driven.** A Spinner works when it is linked (its Drive comes from a Motor through Shafts and Gears) and has a Recipe: such a Spinner is `lined`, and the assistants engine works on `lined` Fixtures as it does elsewhere. There is no Flow and no Line to complete.
- **Speed only.** The bonus is the speed of the linked Spinners, up to a cap that rises with the Tier, delivered by the spinners hired; it adds no yield.
- **Posts and room.** 1, 2, 3, 4 and 5 spinners by Tier, and as many Spinners as the building has production Slots.
- **Skin.** A spinner is drawn as the plain worker used for Restockers and millers.

## Why

The Textile mill had no interior while the Mill, the Bakery and the Dairy did. It turns one fibre into one textile with no intermediate step, so the layout is the Drive alone, and the Recipe chosen on each Spinner is the decision the player keeps.
