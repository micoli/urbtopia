# Assets editor and central models.json

Decided in a grilling session (2026-10-07). See [ADR 0012](../../docs/adr/0012-models-json-single-source-of-model-definitions.md).

## Goal

Centralised management of the assets in `assets/{kenney,quaternius}/*.zip` and `assets/{managed-models,poly.pizza}/*/*.glb`: one `assets/models.json` holds every **Model definition**, and `tools/assets-editor` edits it and manages the assets.

## Scope

- Move `prototypes/asset-viewer` to `tools/assets-editor`; root script `npm run assets:editor`; update paths in `scripts/prototypeAssets.ts`, docs and scripts.
- `assets/models.json`: one entry per model key (existing game keys, unchanged). Fields: `footprint [w,d]`, `scale` or `fit {width,height}`, `rotationOffset`, `bakeNodeScale`, `recolor {color, variants{name: hex}}`, `note`, `source`, `license`, `author`, `url`. No derived facts (bbox, tris).
- Migrate `docs/asset-catalog.json` into it, then delete it; `natureModelFit` and `railModelFit` read their limits from it. Update `docs/asset-catalog.md`.
- Game falls back to computed defaults when an entry is missing.
- Shared TS type in `src/`; vitest check: no orphan entries, no key collision across sources, integer footprints >= 1, valid hex colors, license present.
- Editor: Vite plugin `GET/PUT /api/models` writing `assets/models.json` atomically with stable formatting (replaces `localStorage` and export). Lists the 4 sources with source filter, "used in game" (`MODEL_KEYS`) and "defined" indicators; unknown model shows computed defaults and creates its entry on first edit. Recolor color picker with live preview using the `ModelLibrary` shader; the game picks a variant by name, dynamic colors stay in code.
- Add assets: drop a `.glb` into `assets/managed-models/<category>/`, import from Poly Pizza (reusing `scripts/polyPizza.ts`: `assets/poly.pizza/<slug>/<slug>.glb` + `license.txt`), drop a Kenney or Quaternius zip. License required. After an add, run `npm run assets`.
- Remove: only `managed-models` and `poly.pizza` models, refused if in `MODEL_KEYS`. Zips are never modified. No rename.
- Operations (`addGlb`, `importPolyPizza`, `addPack`, `removeModel`) are modules in `scripts/`, tested on a temp directory; the Vite plugin is a thin adapter.
- `CreditsDialog` reads `source`, `license`, `author`, `url`.
- Docs: ADR 0012, `CONTEXT.md` term **Model definition**, `docs/asset-catalog.md`.

## Out of scope

Reworking `install-assets` / `fetch-assets`, renaming keys, editing zips or GLBs, wiring a new asset into gameplay.

## Delivery

Four successive commits on main, each with build and tests green: see `issues/01` to `04`.
