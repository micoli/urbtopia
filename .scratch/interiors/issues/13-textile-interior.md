# Textile mill interior: Spinners driven by a Motor, with a spinner assigned to each

Status: resolved
Decisions: ADR 0077.

- Fixtures of kind `textileMill` on the Drive engine of the Factory interior: Motor, Shafts, Gears, Bevels, a Spinner and its mirror, Walls.
- A spinner is assigned to a Spinner with a fibre chosen on it (wool, alpaca wool or silk); one Staff per Fixture, one Fixture per Staff.
- Posts: spinners `1, 2, 3, 4, 5`, Technicians `0, 0, 1, 1, 2`; room `5, 6, 7, 8, 9`.
- The bonus is speed only, delivered by the spinners hired.
- Done when: tests cover the Recipe, the Drive, the assignment, the work on its own and the save; the codex and the guide describe the interior.

## Answer

Done: fixtures, balance, `spunOf` in the interior report, role `spinner`, example, texts, codex entry, guide and tests.
