# Knitwear factory interior: Knitters, Finishers and a Display counter on a Drive Line

Status: resolved
Blocked by: 12
Decisions: ADR 0078.

- Fixtures of kind `knitwearFactory`: Motor, Shafts, Gears, Bevels, Conveyors, a Knitter and a Finisher (each with a left-hand variant), a Display counter, Walls.
- A knitter is assigned to a Knitter with a Recipe; a seller to a Display counter with a Sold Good; the Finisher adds speed to every Recipe.
- Posts: knitters `0, 1, 1, 2, 2`, sellers `0, 1, 2, 3, 3`; room `6, 7, 8, 9, 10`; unlocks at 400 Citizens.
- Done when: tests cover the Line, the assignment and the work on its own; the codex and the guide describe the interior.

## Answer

Done: fixtures, balance, role `knitter`, the generalised producer role of the assigned bonus and of the posts, example, texts, codex entry, guide and tests.
