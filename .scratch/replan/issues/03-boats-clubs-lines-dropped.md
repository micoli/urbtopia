# Keep Boats and Clubs, drop Transit lines, keep vehicles

Status: resolved
Blocked by: 01, 02

- Transit lines are not restored: at Start the lines are dropped and their stops and stations are lifted as plain objects; the player draws new lines.
- Purchased vehicles stay with the City, unassigned, and are not lost.
- Cancel restores the lines with the starting layout.
- A Boat keeps its Marina and its type, a Club its Arena and Squad, Stands their Pirate cove, once placed again.
- Moving vehicles, Commuters and Boats are dropped at entry and rebuilt from the grid at exit, never saved.
- Done when: tests that Start drops a Bus line and keeps its vehicles, that Cancel brings the line back, and that a Marina with Boats and an Arena with a Club come back with the same ids and state; `tsc`, lint and tests pass.

## Answer

Done. `withoutTransitLines` (`src/core/replan/transitLines.ts`) drops Bus and Transit lines and unassigns the vehicles; Start (ticket 06) calls it, and Cancel restores the snapshot. Boats and Clubs need nothing more: the Stash keeps whole Buildings (the Club lives on its Arena) and whole Boats, and a Boat is refused until its Marina and Water are back. Moving vehicles and Commuters are derived from the grid and never saved, so there is nothing to drop.
