# Tutorial: place the first buildings to lay a solid base

## Problem

A new game drops the player on a map with a Workshop, a Factory and a road row already placed, and nothing explains what to build next. The player never learns to lay a road, chain Materials into Goods, sell, or house Citizens.

## Decisions

- Starts on a new game only (not on import or an existing save). Can be skipped at any time. Skipping gives today's starting state (Workshop, Factory, road row). Replayable from the menu as a fresh game.
- Starting state of a Tutorial game: the 4 starting Parcels, no building, no road, 2000 Urbs and 10 wood in the Storehouse stock (a Tutorial-only start, enough to cover every step).
- State (current step, finished or skipped) lives in the saved `GameState`. No migration and no backward compatibility: there are no users yet, the save fixture is updated in place.
- Steps, in order. The type to place is imposed, the position is free:
  1. Road
  2. Workshop (100)
  3. Factory (250)
  4. Storehouse (400): collecting production needs one
  5. Queue wood, Time skip, collect (the 10 starting wood avoids five production rounds later)
  6. Queue planks until 5 are stored (a Shop stack holds 5), with Time skip and collect each round
  7. Shop (300)
  8. Stock the Shop with planks
  9. Time skip until the first sale
  10. Power plant (250) and Water tower (200), required before any Home
  11. Home (150)
  12. Time skip until Tax is due, then the game is free (the closing message tells the player to collect it)
- A step is valid when a pure function of `GameState` says so (for example "a Workshop with an adjacent road exists"). The Tutorial listens to no command, so it survives import, reload and Catch-up.
- Commands that do not match the current step, including demolition and selling, are refused with `error.tutorialLocked`. Moving a building, extending the road and the +12 h / +24 h Time skip are always allowed.
- Skipping when nothing was built gives the legacy start. Skipping once underway ends the Tutorial and keeps the city as it is.
- Time skip: a contextual button that advances exactly the time left for the current step. The +12 h and +24 h menu buttons are unchanged.
- UI: one step banner (title, text, contextual Time skip button, Skip button) shown on all three layouts, plus a highlight on the expected tool. No automatic camera, no arrows.
- Out of scope: Parcel purchase, Home upgrade, Market.

## Glossary

`Tutorial` and `Time skip` are defined in `CONTEXT.md`.

## Testing

Pure core logic is covered by Vitest: step validation, locked commands, Time skip duration, skip to the legacy start. UI and highlight are checked by eye in the browser.
