---
status: accepted
---

# Interior commands edit through one module

Refines [ADR 0081](0081-interior-profile-is-the-one-seam-of-the-interior-family.md). About fifteen commands change the `interior` of one building and the Urbs of the city: place, move, remove and repair a Fixture, the parquet, the Technician and the Restocker, the restock of an Exit, the assignments and the focus of a Fixture, hiring and releasing Staff. Each repeats the same steps in its own file: find the building, check a gate (`error.unknownBuilding`), validate, compare `state.urbs` with a price (`error.notEnoughUrbs`), then rewrite `buildings` with the new `interior`. The gate comes in five variants of `hostOf` (any interior, a Production interior, a Factory or a Packhouse, a building with assignments, a building that declares the role), `EMPTY_INTERIOR` is declared three times, and the rewrite has four shapes (`withInterior`, `withStaff`, two `withFixture`).

## Decisions

- **One function.** `editInterior(state, buildingId, host, change)` in `src/core/interiors/interiorEdit.ts`. `host` is the gate, a named predicate that stays a rule of the domain (`isInteriorBuilding`, `hasProductionInterior`, `hasAssignments`…). `change(building, interior)` returns either a command error or `{ interior, urbs? }`, where `urbs` is a signed delta (a cost is negative, a refund positive).
- **What the module does.** It finds the building and answers `error.unknownBuilding` when it is missing or the gate refuses; it hands `change` an empty interior when the building has none; it passes an error of `change` through unchanged; it answers `error.notEnoughUrbs` when `state.urbs + urbs` would be negative, and checks it last, after the validations of `change`, as the commands do today; it replaces only that building and applies the delta. The commands no longer compare `state.urbs` with a price themselves.
- **Scope.** The commands that change the `interior` of one building and the city's Urbs. Outside it: the breaker (it changes the `Building`, and serves the Venues as well) and the wages of the Staff (`payInteriorStaff` touches every building). The two paths of the Restocker (the `restockers` counter of the Factory and the Packhouse, the `restocker` role of the other interiors) stay as they are; unifying them is a separate change of the model.
- **A leaf module, files where they are.** The module imports nothing from `core/factory`. `interiorCommands`, `interiorAssignments` and `interiorStaffCommands` depend on it. There is no cycle between files, only a link between the directories `core/interiors` and `core/factory`, and moving files to remove it would be a mass rename for no gain in locality.
- **Migration one command at a time.** Simplest first: Technician and Restocker, parquet, repairs, Fixtures, Staff, then assignments and focus. Each step starts from a test, and keeps the existing command tests green. The old `hostOf`, `withInterior`, `withStaff`, `withFixture` and `EMPTY_INTERIOR` go with their last caller. The dead aliases of `interiorCommands.ts` (`kindOf`, `gridSizeOf`, `InteriorHost`) go too.
- **Two levels of test.** A test of the interface of `editInterior`: unknown building, refused gate, error passed through, not enough Urbs (error, state untouched), success (only the target building replaced, the others keep their identity, the delta applied, an empty interior given). Before a command is migrated, an existing test must cover its refusals (unknown building, not enough Urbs); a missing one is added first, so the order of the validations survives the migration.

## Why

The steps are one decision with fifteen readers. In one module a rule of the Urbs, or of the building replaced, is fixed once (locality), and a new command writes its change only (leverage). Deleting the module would bring the five gates and four rewrites back into the commands, so it earns its keep.

## Considered options

- **A helper per kind of command** (fixtures, staff, assignments). Rejected: the rewrite and the Urbs rule stay repeated in each helper.
- **Move the interior commands under `core/interiors`.** Rejected for now: a mass rename without a gain in locality; the new module is the seam, not the folder.
- **A generic reducer for every command of the engine.** Rejected: out of scope; `commands.ts` is a separate question.

## Consequences

- The five gates remain as named predicates; only the lookup and the rewrite move.
- Where the existing tests do not check a refusal, the migration adds that test before the move.
