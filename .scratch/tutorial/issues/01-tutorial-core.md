# Tutorial steps in the core

Type: task
Status: resolved

## What to build

The Tutorial state, its Tutorial-only starting game, the step validation and the contextual Time skip, all in `src/core`. See `../spec.md`.

## Seams under test

- `newGame` with the Tutorial option: empty map, about 1300 Urbs, first step.
- Step validation: `GameState` in, current step out (road, Workshop, Factory, production, Shop and sale, utilities, Home and Tax).
- Locked commands: `dispatch` refuses building types and demolition that do not fit the current step.
- Tutorial Time skip: state in, exact milliseconds left for the step out.
- Skip: Tutorial state in, legacy starting state out.

## Acceptance criteria

- [x] A new Tutorial game has no building and no road, and enough Urbs for steps 1 to 8.
- [x] Each step validates from `GameState` only, and the Tutorial advances automatically.
- [x] Commands outside the current step are refused, moving a building is allowed.
- [x] Time skip advances exactly the time left for steps 4 and 5.
- [x] Skipping an untouched Tutorial gives the Workshop, Factory and road row start. Skipping once underway keeps the city.
- [x] The save fixture is updated, no migration added.
- [x] Typecheck, lint and the full test suite pass.

## Answer

`src/core/tutorial.ts` holds the steps, the pure validation, the command locks and the Time skip duration. `newGame({ tutorial: true })` starts it, `SkipTutorialStep` and `SkipTutorial` are new commands. The Tutorial step lives in `GameState.tutorial` (null when off). The game rules forced two additions to the spec: a Storehouse step (collecting needs one) and 10 starting wood (a Shop stack holds 5 Goods). Covered by `tutorial.test.ts`. Typecheck, lint and the 351 tests pass.

The UI does not start the Tutorial yet: that is ticket 02.
