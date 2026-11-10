# Replan a zone, keep the lines

Status: resolved
Blocked by: none

Change of spec asked after the first delivery.

- The Replan button closes the window and arms a zone tool: two opposite corners draw a rectangle, and `StartReplan` takes the rectangle as `area`.
- Only what the rectangle touches, on every Level, goes into the Stash; the rest of the City stays. A Building or Bridge it only touches is lifted whole, and so are the Boats of a lifted Marina or Pirate cove and the Stands of a lifted Pirate cove. An empty rectangle is refused.
- Transit lines are not dropped any more: only the references to the stops in the Stash are taken out; a line left with fewer than two stops goes and its vehicles are unassigned.
- The summary counts the lines that lost a stop.
- Done when: tests of the zone, of the lines and of Cancel; the e2e draws the zone; `tsc`, lint and tests pass.

## Answer

Done. `liftZone` (`src/core/replan/zone.ts`) replaces the whole-City lift; with no `area` it still lifts everything. The `replanArea` tool (`src/tools/tools.ts`) draws the rectangle, with the hint `replan.areaStart`. Ticket 03's `withoutTransitLines` is gone; lines go through `withoutStopReferences`. The summary field is `brokenLines`. Spec, ADR 0067, CONTEXT.md and the Guide say so.
