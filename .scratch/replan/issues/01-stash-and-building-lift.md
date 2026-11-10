# Stash model and lift/place of Buildings

Status: ready-for-agent
Blocked by: none

- Core state: `replan` block (active flag, Stash, starting layout), absent when no Replan.
- Pure functions to lift a Building into the Stash whole (id, Tier, interior, contents) and to place it back on any free tile of an owned Parcel with any rotation, under the placement rules of a new Building (`src/core/map/placement.ts`).
- Lifting ignores the "last access" and tying rules; placing checks only free tile, owned Parcel and rotation.
- Done when: unit tests show a Venue, a Factory with a Factory floor and a Home with a Home interior come back identical after lift and place elsewhere; `tsc`, lint and tests pass.
