# Plans in the save

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

The plans of the player, saved in the city and edited through commands.

## Acceptance criteria

- [x] The state holds the saved plans; commands save, rename and delete a plan.
- [x] The save validates a plan (grid, floors, bricks, roofs) and the save version goes up with a migration.
- [x] The studio reads and writes plans through the store, not the browser storage.
