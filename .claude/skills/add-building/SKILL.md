---
name: add-building
description: Add a new placeable building, decoration or green-space element (a 3D model the player can build) to the Urbix game. Asks the category (build menu section), the unlock threshold in Citizens and the price, then adds one file to assets/defs/buildings. Use when the user wants to add a model, building or constructible to the game.
---

# Add a building to the game

Talk to the user in French. Code, identifiers and comments in English, comments only when the code is ambiguous. Never use trademarked game names (SimCity terms) in names, docs or code.

Every building is one file `assets/defs/buildings/<id>.json`, validated by the zod schema of `src/core/buildings/buildingSchema.ts` (ADR 0021). Menu, specs, unlocks, model, codex and texts are derived from it.

## 1. Gather inputs

Read the files of the chosen section in `assets/defs/buildings/` and `src/core/buildings/buildSections.ts` (the sections). Ask with `AskUserQuestion` (one call, several questions) and skip any answer the user already gave.

- **Model key** `<theme>/<name>` in `assets/models.json`. If it is not defined there, stop and tell the user to add the model first (assets editor); never invent a key.
- **Category** (section): `build.housing`, `build.production`, `build.storage`, `build.utilities`, `build.transport`, `build.publicFacilities`, `build.leisure`, `build.sport`, `build.decoration`, `build.greenSpaces`.
- **Unlock threshold** in Citizens: propose a value from the neighbours in the chosen section.
- **Price** in Urbs: propose a value from comparable buildings.
- **Id** (camelCase; hyphenated for nature elements), **English and French name**, **English and French one-sentence description**.
- **Footprint** (default: from `models.json`) and **requiresRoad** (default `true`).
- **Well-being radius and bonus** if it is a sport venue (propose the values of the other venues).

For decoration and green spaces there is no free price or threshold: ask the **nature family** instead (`NATURE_FAMILIES` in `src/core/environment/natureFamilies.ts`) and show each candidate's `cost` and `unlock`. Decoration section means family `decoration`; green spaces means `tree`, `conifer`, `palm`, `shrub`, `flower`, `grass` or `habitat`. If no family fits the wanted price, offer the closest one.

Confirm the recap in one short message before editing.

## 2. Add the entry

Edit through `scripts/buildingsFile.ts` so the building is validated (schema and model), its `order` is set and `src/core/buildings/buildingTypes.generated.ts` and `assets/defs/schemas/building.schema.json` are regenerated in the same step. `readBuildings` returns the buildings in menu order (their `order` field) and `writeBuildings` renumbers them from that order: insert the new one after the last entry of its section.

```bash
node -e "import('./scripts/buildingsFile.ts').then(({ readBuildings, writeBuildings }) => {
  const all = readBuildings();
  const next = {};
  for (const [id, definition] of Object.entries(all)) { next[id] = definition; if (id === '<last entry of the section>') next['<new id>'] = { /* entry */ }; }
  writeBuildings(next);
})"
```

Entry shapes (`order` and `$schema` are added by `writeBuildings`):

```json
"myVenue": {
  "kind": "sport", "section": "build.sport", "model": "poly.pizza/some-model", "footprint": [10, 10],
  "cost": 2500, "unlockCitizens": 300, "requiresRoad": true,
  "name": { "en": "English name", "fr": "Nom français" },
  "description": { "en": "English sentence.", "fr": "Phrase française." },
  "radius": 12, "wellbeingBonus": 10
}
```

An ordinary building is `"kind": "standard"` without `radius` and `wellbeingBonus` (add `initialSlots` only for Shop-like stacks). A nature element has only `kind`, `model`, `name` and `family`:

```json
"nature-tree-oak": { "kind": "nature", "model": "nature/tree_oak", "name": { "en": "Oak", "fr": "Chêne" }, "family": "tree" }
```

The user can also fill the form of the assets editor (`npm run assets:editor`): each model lists the buildings that use it.

## 3. When the building has rules

A building with behaviour beyond data (Tiers, capacities, production, energy, service coverage) also needs code keyed by its id: a rule table such as `FACILITIES` (category, radius, capacity, power, water) or a constants module like `CASINO`. Mirror an existing building of the same kind (`git show a35f80c --stat` shows a hand-wired one from before ADR 0014). Tier models stay in `src/scene/renderItems.ts`; `model` in the entry is the Tier 1 model. If the building should announce its unlock, add `event.unlocked.<id>` and the entry in `facilitiesUnlockedBetween` (`src/core/progression/unlocks.ts`) and `events.ts`. Finish with `grep -rn "<similar id>" src scripts`.

## 4. Test and verify

1. `npx tsc --noEmit`: `Record<BuildingType, …>` maps point at every missing case.
2. `rtk proxy npx vitest run` (the rtk filter hides the summary). `scripts/buildingsFile.test.ts` checks every building file, the generated types and the JSON Schema (after a hand edit, `npm run defs:generate`), and `buildingDefinitions.test.ts` checks specs and texts; the codex image manifest is regenerated by `npm run codex:generate`, do not edit `public/codex/manifest.json`.
3. `npm run assets` copies a `poly.pizza/<slug>` model to `public/models/` when a building uses it; run it once to check.
4. `npm run lint`.
5. Report the entry added, the chosen values (category, unlock Citizens, price or family) and anything left undone. Do not commit unless the user asks.
