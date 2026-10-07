---
name: add-building
description: Add a new placeable building, decoration or green-space element (a 3D model the player can build) to the Urbix game. Asks the category (build menu section), the unlock threshold in Citizens and the price, then adds it to the right data table (sport venues, nature elements) or wires it by hand. Use when the user wants to add a model, building or constructible to the game.
---

# Add a building to the game

Talk to the user in French. Code, identifiers and comments in English, comments only when the code is ambiguous. Never use trademarked game names (SimCity terms) in names, docs or code.

## 1. Choose the path

Read `src/codex/buildingSections.ts` first: its `BUILDING_SECTIONS` are the categories. Ask with `AskUserQuestion` (one call, several questions) and skip any answer the user already gave.

**Category** (always ask): `build.housing`, `build.production`, `build.storage`, `build.utilities`, `build.transport`, `build.publicFacilities`, `build.leisure`, `build.sport`, `build.decoration`, `build.greenSpaces`; "new category" through the automatic "Other" choice.

The category selects the path:

| Category | Path | Files touched |
|---|---|---|
| `build.sport` | Sport venue | 1 (`assets/models.json`) |
| `build.decoration`, `build.greenSpaces` | Nature element | 1 (`assets/models.json`) |
| anything else | Fallback | many |

Always needed: **model key** `<theme>/<name>` in `assets/models.json`. If the model is not defined there yet, stop and tell the user to add it first (assets editor); never invent a key.

## 2. Wire it up

### Path A: sport venue

Ask the **unlock threshold** (Citizens; propose from `ECOLOGY_UNLOCKS` in `src/core/environment/ecology.ts` neighbours), the **price** in Urbs (propose from comparable `BUILDING_SPECS`), the **footprint** (default: the model's own `footprint` in `assets/models.json`), the Well-being **radius** and **bonus** (propose from the other sport venues), the **id** (camelCase) and the **English and French name and one-sentence description**. Confirm the recap in one short message.

The data lives in `assets/models.json`, not in code (ADR 0013). Add a `building` block to the model's entry, and a `footprint` if it has none:

```json
"poly.pizza/some-model": {
  "source": "poly.pizza", "license": "CC-BY 3.0",
  "footprint": [10, 10],
  "building": {
    "kind": "sport", "id": "myVenue",
    "name": { "en": "English name", "fr": "Nom français" },
    "description": { "en": "English sentence.", "fr": "Phrase française." },
    "unlockCitizens": 300, "cost": 2500, "radius": 12, "wellbeingBonus": 10
  }
}
```

Edit it through `scripts/modelsFile.ts` rather than by hand, so the entry is validated and `src/core/buildings/buildingTypes.generated.ts` is regenerated in the same step:

```bash
node -e "import('./scripts/modelsFile.ts').then(({ readModels, writeModels }) => { const d = readModels(); d['<model key>'].building = {...}; writeModels(d); })"
```

(The user can also fill the "Building" form of the assets editor, `npm run assets:editor`.) Never edit the generated types file; a test fails when it is out of date. Everything else derives from the entry: `BuildingType`, specs, unlocks, model, the `build.sport` menu section, codex, toast, i18n, range preview, Home panel and Well-being effect. Do not touch any other file.

### Path B: nature element (decoration and green spaces)

Price, unlock threshold, footprint (1×1), radius and bonuses come from the **family** in `NATURE_FAMILIES` (`src/core/environment/natureFamilies.ts`), not from the element. So instead of asking a free price and threshold, ask the **family** and show, for each candidate, its `cost` and `unlock`:

- Decoration section: family `decoration`.
- Green spaces section: `tree`, `conifer`, `palm`, `shrub`, `flower`, `grass`, `habitat`.

If the user wants a price or threshold that no family has, say so and offer the closest family; do not add a per-element override unless the user asks. Ask the **id** (kebab-case, e.g. `nature-tree-oak`) and the **English and French name**, confirm, then add to the model's entry in `assets/models.json`, the same way as path A:

```json
"building": { "kind": "nature", "id": "nature-tree-oak", "family": "tree", "name": { "en": "Oak", "fr": "Chêne" } }
```

The menu section, codex entry, description (per family), unlock, price and i18n name all derive from it. Do not touch any other file.

### Path C: any other building

Use when the category is neither Sport, Decoration nor Green spaces. Ask the unlock threshold, the price, the footprint and requiresRoad, the type id (camelCase), the English and French names and codex description, and whether it has a gameplay effect; confirm the recap first. Mirror what the data-driven tables already do (`FACILITIES` in `src/core/services/facilities.ts`, `NATURE_MODELS`): prefer extending a table over adding scattered `if` branches. Reference implementations: `git show a35f80c --stat` (a former hand-wired stadium, now a table entry). Files that name a plain building: `state.ts` (`BuildingType`), `buildingSpecs.ts`, `ecology.ts` (`ECOLOGY_UNLOCKS`), `renderItems.ts` (`MODEL_BY_BUILDING`), `buildingSections.ts`, `catalog.ts` (`DESCRIPTIONS`), `i18n/messages.ts` and `i18n/fr.ts` (`building.<id>`, `codex.description.<id>`), and, for an unlock toast, `unlocks.ts`, `events.ts`, `event.unlocked.<id>`. Finish with `grep -rn "<similar type>" src scripts` to catch anything missed.

### Models

A `poly.pizza/<slug>` model is copied to `public/models/` by `npm run assets` only when `src/scene/renderItems.ts` names it; models with a `building` block are copied too, so nothing else is needed. Run `npm run assets` once to check. If the model is not in `assets/models.json` yet, stop and ask the user to add it first.

## 3. Test and verify

1. Paths A and B need no new test. For path C, add a test next to the module for any gameplay effect.
2. Run `npx tsc --noEmit`. The `Record<BuildingType, ...>` maps make TypeScript point at every missing place.
3. Run `rtk proxy npx vitest run` (the rtk filter hides the summary). `validateCodex` fails if the codex entry is missing; the codex image manifest is regenerated by `npm run codex:generate`, do not edit `public/codex/manifest.json` by hand.
4. Run `npm run lint`.
5. Report: the files changed, the chosen values (category, unlock Citizens, price or family) and anything left undone (for instance codex images to generate). Do not commit unless the user asks.
