# Entry button and Stash tray

Status: resolved
Blocked by: 06

- A "Replan" button on the row of the open City in `src/ui/system/CityRow.tsx`, disabled with the reason written next to it when refused; a confirmation (`Dialog`) says the game stands still and Cancel restores.
- During a Replan: a Stash tray grouped by type with counts; choosing an item arms it for placement with the usual ghost and rotation; a banner with Cancel and Finish (Finish disabled while the Stash is not empty).
- UI rules of ADR 0051: tokens, `@layer legacy`, `Icon`, `cva`, one component per file; FR and EN strings.
- Done when: a Playwright test (`?e2e`, headless) lifts a small city, places everything and finishes; Storybook stories for the tray; `tsc`, lint and tests pass.

## Answer

Done. `StartReplanButton` sits on the row of the open City (`CityRow`), with a confirmation dialog and the refusal written beside it (Challenge, Tutorial, Save conflict; `startRefusal.ts`). `ReplanPanel` shows the Stash grouped by type with counts (`stashGroups.ts`), Cancel (confirmed) and Finish (disabled until the Stash is empty). Choosing a group arms a tool: `replanBuilding`, `replanBridge` and `replanBoat` pick the first matching object of the Stash and stay armed; `replanPath` draws Roads, Pedestrian ways, Walkways and the three networks by two clicks; `replanTile` lays Crossings, Roundabouts and Pedestrian accesses; the brush paints Water tiles and Fields. Headless Playwright test `scripts/replan.e2e.ts` (added to the gameplay config) covers start, cancel, replace and finish. Stories for the panel and the dialog were written but the Storybook smoke test was not run.
