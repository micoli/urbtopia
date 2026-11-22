# Generic fixtures: execution plan

Branch: `refactor/generic-fixtures` (from `main`, no worktree). One commit per step, on request. Green tests at every commit.

## Decisions (settled by grilling)

- `family` + `role` stay the key of the coded behaviour. No `type` field.
- A fixture file carries: `ports[{side, medium, direction, optional?}]`, `bonuses[{effect, value}]`, `traits[{trait, value?}]`, `placement`, `visual`. Closed vocabularies, validated by the schema.
- Media: `drive`, `gear` (teeth, meshes with `gear` only), `flow`, `line` (in/out), plus the engine-room media. Turn direction stays computed by the Drive solver.
- `venues: [...]` replaces `venue`; optional `overrides` per venue. The loader expands to the existing ids (`venue` + Name). `FixtureId`, saves, tests and Codex ids do not change. No save migration.
- One connector file per medium generates the straight / elbow / tee / cross shapes.
- Menu categories and order move to the venue definition (JSON); `order` on the fixture; `assets/defs/order/fixtures.json` goes away.
- Per-venue allow-lists of effects, traits, media, checked at build. zod is the single source; JSON Schema and types are generated.
- Engine-room circuits are derived from ports (+ `optional`), the `circuits[]` flowcharts of `interiors.json` go away. The rest of `interiors.json` (feeds, requires, milling, tier caps) stays.
- Codex iterates `bonuses`/`traits` generically; message keys unchanged; render identical.
- Acceptance: golden (expanded new files == the 519 current fixtures field by field, menu order included), Codex snapshot identical, no behaviour test changes. A test that must change is flagged to the user first.
- Docs: one ADR (amends 0092 and 0084), `CONTEXT.md` (Effect, Trait, optional port), Guide/Codex fixed only if wrong. No trademarked names.

## Baseline (main a1ce5ace)

519 fixture files, 278 distinct definitions, 47 cross-venue groups. Only 44 use `ports`; the others use `drive` (146), `lineIn`/`lineOut` (~135), `flow` (64), `joins` (46), `partition` (92) and per-role scalars. Field semantics and consumers: see the exploration report in the grilling session (interiorLinks.ts, interiorLine.ts, interiorBonus.ts, engineRoomCircuits.ts, venues/*.ts, codex/fixtureFacts.ts).

## Steps

### 0. Safety net (no behaviour change)
- Freeze the baseline: script that dumps the 519 resolved `FIXTURES` specs (all fields, registry order) to a golden JSON under `src/core/venues/__golden__/`. Test: current registry == golden.
- Codex snapshot: render `fixtureFactsOf` for every fixture page and interior row, store as golden. Test: identical.
- Exit: both goldens pass on untouched code.

### 1. New schema + expansion layer
- New zod model for the new file shape (`venues`, `overrides`, `ports`, `bonuses`, `traits`, `placement`, `visual`, `order`), vocabularies defined once in `venueVocabulary.ts` (`FIXTURE_EFFECTS`, `FIXTURE_TRAITS`, extended `FIXTURE_MEDIA`), per-venue allow-lists, venue-level category/order.
- Generate JSON Schema + `FixtureId` from zod (replace the hand-kept `fixture.schema.json`).
- Expander: new file -> legacy `FixtureSpec` (id rule `venue + Name`, overrides, generated connector shapes). Registry reads expanded specs.
- Compatibility: the registry accepts old and new files at once, so each later step migrates a slice.
- Exit: unit tests of the expander on hand-written samples; goldens still pass.

### 2. Migration script (throwaway)
- Script converts legacy files to the new shape, merges identical definitions into `venues`, extracts connector families. Runs per slice (venue list argument).
- Dry-run mode prints the diff of expanded specs vs golden. Ids that break the `venue + Name` rule are listed and declared explicitly.
- Exit: dry-run over all 519 yields zero expanded-spec difference.

### 3. Engine room slice (coalPlant, hydroPlant, geothermalPlant, largeGeothermalPlant)
- Migrate the 56 files (26 distinct definitions) to shared files + connector generators.
- Derive circuits from ports: required ports gate a circuit, `optional` = cleaning. Anchor types and tier caps stay declared by the building.
- Remove `circuits[]` from `interiors.json` + schema; `bonuses` (`generation`, `cleaner`) on Alternator/Filter.
- Exit: `engineRoom*.test.ts`, demonstrations, goldens unchanged and green. Derivation corrected in code if a case differs, never the tests.

### 4. Drive / Flow / Line as ports (production venues)
- Convert `drive`, `rim`, `flow`, `lineIn`, `lineOut` into ports (`drive`, `gear`, `flow`, `line`); `turns`, `reverses` into traits; `strength`, `draw`, `power` into bonuses.
- Rewrite `sidesOf`/`connectionsOf`/`sameKindOfEdge` in `interiorLinks.ts` and `interiorLine.ts` to read ports. Behaviour (solvers, problems, line paths) untouched.
- One bonus model per commit: `factory`, `packhouse`, `machines`, `line`, `assigned`. `interiorBonus.ts` reads `bonuses` instead of named scalars (`speed`, `yield`, `sales`, `capacity`, `coolant`, `heat`, `yieldGroup`).
- Exit: all `src/core/factory/*.test.ts`, line and bonus tests green unchanged; goldens green.

### 5. Placement, partitions and non-production venues
- `placement` for `minRank`, `partition`, `passable`, `onWall` (merges `wall` + `wallPort`), `joins`, `packSize`; `visual` for `tint`, `truck`, `smoke`, `hatch`.
- Migrate home, arcade, hotel, supermarket, restaurant, library, school, hospital (numeric fields to `bonuses`; `seat`, `assigns`, `picks`, `loud`, `prep`, `reception` to `traits`).
- Update consumers (`venues.ts`, `partitions.ts`, `hotel.ts`, `restaurant.ts`, `supermarket.ts`, `arcade.ts`, `serviceInterior.ts`, `homeInterior.ts`, `interiorCommands.ts`, `VenueScene.ts`, persistence `validate.ts`).
- Exit: venue and persistence tests, saves v1..v21 contract tests green unchanged.

### 6. Codex generic
- `fixtureFacts.ts`: `FIGURES`/`usageOf` iterate `bonuses`/`traits`; message keys per effect reuse the current keys.
- Exit: Codex snapshot identical for all fixtures.

### 7. Cleanup and docs
- Delete the legacy file shape support, the old fields in the zod union, `assets/defs/order/fixtures.json`, dead helpers (`roleOf` branches already covered, `isLink` by family if replaced).
- ADR (next number after 0092) amending 0092/0084; `CONTEXT.md` terms; Guide/Codex pages only where now false.
- Exit: `npm run defs:generate` clean, lint, typecheck, full test suite, `build/*` tests, golden + Codex snapshot, one manual pass in the game (browser `?e2e`) on a coal plant and a factory interior.

## Risks and watch points

- Ids that do not follow `venue + Name`: handled by explicit ids, surfaced by the step 2 dry-run.
- Per-role semantics hidden behind a field (`drive` side lists used in `VenueScene.ts:553` staff stand, `codex/fixtureFacts.ts`): grep every consumer of a field before removing it.
- `family === 'link'` is used as a marker in the engine room: replaced by a connector trait or by a port-only rule, decided in step 3 with the golden as judge.
- Generated connector shapes must reproduce current model ids and wear/price exactly; any fixture that does not fit the pattern stays hand-written.
- The `largeGeothermalPlant` has an interior profile but no fixture files of its own: check in step 3 what it reuses.
- Production hooks: `isRestockable` (heat), persistence `validate.ts` (`assigns`, `picks`, `family === 'pen'`) must read the new fields in the same commit that moves them.
