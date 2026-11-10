# Entry button and Stash tray

Status: ready-for-agent
Blocked by: 06

- A "Replan" button on the row of the open City in `src/ui/system/CityRow.tsx`, disabled with the reason written next to it when refused; a confirmation (`Dialog`) says the game stands still and Cancel restores.
- During a Replan: a Stash tray grouped by type with counts; choosing an item arms it for placement with the usual ghost and rotation; a banner with Cancel and Finish (Finish disabled while the Stash is not empty).
- UI rules of ADR 0051: tokens, `@layer legacy`, `Icon`, `cva`, one component per file; FR and EN strings.
- Done when: a Playwright test (`?e2e`, headless) lifts a small city, places everything and finishes; Storybook stories for the tray; `tsc`, lint and tests pass.
