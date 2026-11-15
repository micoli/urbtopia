# Livestock farm interior: a feeding Line, Pens and a herder

Status: resolved
Blocked by: 13, 14
Decisions: ADR 0079.

- Fixtures of kind `livestockFarm`: Motor, Shafts, Gears, Bevels, Conveyors, a Feed intake (with a left-hand variant), a Feeder, a Collection exit, a Pen, Walls.
- A Pen with a Recipe next to a Feeder that the Line reaches works; a herder is assigned to it.
- The yield comes from the Collection exits that the Line reaches, delivered by the herders hired; no speed.
- Posts: herders `1, 2, 3, 4, 5`; room `6, 7, 8, 9, 10`; unlocks at 80 Citizens.
- Done when: tests cover the Pens, the yield and the work on its own; the codex and the guide describe the interior.

## Answer

Done: fixtures, balance, role `herder` and part `yield`, `fedOf` in the interior report, animals drawn at 1.6 times their size in the Pens, example, texts, codex entry, guide and tests.
