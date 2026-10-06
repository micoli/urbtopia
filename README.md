# Urbtopia

A solo, serverless isometric city builder that runs in the browser, on phone, tablet and desktop. Produce Materials, turn them into Goods, sell them for Urbs, and spend the Urbs to grow a city of up to 160-Citizen Homes. Everything is saved on your device: no account, no server.

The vocabulary used in code and docs (Urbs, Workshop, Factory, Parcel, Catch-up…) is defined in [`CONTEXT.md`](CONTEXT.md).

## Features

- Isometric 3D city on a 128x128 map of 16x16 Parcels, with roads, roundabouts and crossings.
- Production chains: Workshops make Materials, Factories make Goods, Shops and the Market turn them into Urbs.
- Homes with six Tiers, shared power and water capacity, Tax collected by hand, population-gated Unlocks.
- Real-time progress, caught up in one pass when you come back (up to 48 hours).
- Installable web app (Android and others) that updates itself and works offline.
- French and English, three interchangeable HUD layouts, touch first (pan, pinch, two-finger rotation).
- Codex of every constructible, grouped by section, with descriptions, population unlocks and a rendered gallery of every Tier.
- Local save with automatic backup, JSON export and import, recovery screen, single active tab.

## Getting started

Requires Node.js 22.18 or newer (the scripts run TypeScript directly) and npm.

```sh
npm install
mise install npm:playwright  # installs the pinned CLI and Chromium
npm run dev      # http://localhost:5173, prepares models and codex previews first
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build to `dist/` (service worker stamped per build) |
| `npm run preview` | Serve the production build |
| `npm test` | Unit and property tests (Vitest) |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run assets` | Extract the 3D models from the versioned archives into `public/models` |
| `npm run assets:fetch` | Refresh the archives from kenney.nl (see [Assets](#assets)) |
| `npm run assets:prototypes` | Copy the models the prototypes load |
| `npm run casino:sim` | Casino simulator: play each Minigame with 100 000 Urbs, one URL per game (`/slot-machine`, `/blackjack`, `/blockmatch`, optional `?tier=`) |
| `npm run codex:generate` | Generate static codex images; append `-- --force` to regenerate |
| `npm run test:codex` | Browser checks against a production build, including mobile and offline access |
| `npm run test:codex:images` | CI check that every codex image exists in the production build and is served |

`dev` and `build` prepare models and codex previews first. Models come from the archives committed in `assets/kenney/`; the preview generator uses local Chromium and reuses unchanged output. After installing dependencies and Chromium, these steps work offline.

The codex catalog is checked against every building in `BUILDING_SPECS` and every network tool in the shared construction registry. Adding a constructible requires a section, French and English descriptions, and a preview for every Tier. Missing entries, translations, models or generated images block CI and deployment. CI checks image availability only, without checking pixels, dimensions or visual accuracy. Generated images and their manifest live in `public/codex/`, are excluded from Git, and are included in the offline cache.

## Deployment

Every push to `main` runs the checks (type-check, lint, tests), builds, and deploys `dist/` to GitHub Pages with [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The site is served at `https://micoli.github.io/urbtopia/`; the build uses relative paths, so any sub-path works. GitHub Pages must be set to the **GitHub Actions** source in the repository settings (Settings, Pages, Build and deployment).

## How it is built

TypeScript, Vite, three.js (imperative, chunked instancing), React for the HUD only, Zustand between them, Vitest.

```
src/core         pure simulation: state, commands, advance(now), no clock, no DOM
src/scene        three.js scene, camera controls, instanced chunks
src/tools        build tools: ghost evaluation by dry-running core commands
src/store        Zustand stores (game, UI, dialogs, toasts)
src/ui           React HUD: dock, panels, layouts A, B and C
src/persistence  versioned save envelope, migrations, autosave, backup, import/export
src/pwa          service worker registration, install prompt
src/i18n         English and French catalogs, preferences
build, scripts   service worker stamping, asset tooling
docs             ADRs, research notes, asset catalog
```

Design decisions are recorded in [`docs/adr`](docs/adr):

1. [Imperative three.js with chunked instancing](docs/adr/0001-imperative-three-chunked-instancing.md)
2. [Pure core with an injected clock and replay-based catch-up](docs/adr/0002-pure-core-injected-clock-replay-catch-up.md)
3. [localStorage saves in a versioned envelope](docs/adr/0003-localstorage-versioned-save-envelope.md)

The product spec and the work breakdown live in [`.scratch/urbix-mvp`](.scratch/urbix-mvp).

## Assets

The 3D models come from Kenney asset packs (see [Credits](#credits)). The original archives are versioned in `assets/kenney/`, so installing and building never need the network. `npm run assets` extracts only the models the scene uses into `public/models`, which is generated and ignored by git. `npm run assets:prototypes` makes all registered packs available in the assets editor (`npm run assets:editor`), including packs with no models selected for the game.

To update the archives, run `npm run assets:fetch`. The download links contain a hash that changes with each Kenney release: if one fails, copy the new link from the pack page into `scripts/assetPacks.ts`. Archives are validated before they replace the old ones. Then run `npm run assets -- --force` and commit the new archives.

Crops and farm buildings come from two Quaternius packs, versioned in `assets/quaternus/`. They ship FBX only, so `npm run assets` converts the models the scene uses to GLB (scaled to one tile) with the three.js FBX loader, keeping a single GLTF loader at runtime.

Models with no downloadable source (made by hand in Blender) are versioned as GLB in `assets/managed-models/<theme>/`. `npm run assets` copies them as is to `public/models/<theme>/`, next to the extracted packs.

The [`prototypes`](prototypes) folder holds throwaway prototypes (render benchmark, touch UX, casino simulator) that informed the design. Only their sources are versioned; `npm run assets:prototypes` copies the models they load.

## Credits

3D models: **[Kenney](https://kenney.nl)**, released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (public domain). Attribution is not required, and is gladly given.

- [City Kit (Roads)](https://kenney.nl/assets/city-kit-roads) 2.1
- [City Kit (Commercial)](https://kenney.nl/assets/city-kit-commercial) 2.1
- [City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) 2.0
- [City Kit (Industrial)](https://kenney.nl/assets/city-kit-industrial) 2.0
- [Car Kit](https://kenney.nl/assets/car-kit) 3.1
- [Nature Kit](https://kenney.nl/assets/nature-kit) 1.0
- [Mini Forest](https://kenney.nl/assets/mini-forest) 1.0
- [Graveyard Kit](https://kenney.nl/assets/graveyard-kit) 5.0
- [Holiday Kit](https://kenney.nl/assets/holiday-kit) 2.0
- [Pirate Kit](https://kenney.nl/assets/pirate-kit) 2.1
- [Watercraft Kit](https://kenney.nl/assets/watercraft-kit) 2.1
- [Train Kit](https://kenney.nl/assets/train-kit) 1.1

3D models of crops and farm buildings: **[Quaternius](https://quaternius.com)**, released under CC0 1.0 Universal (public domain), from the Farm Crops and Farm Buildings packs.

Each archive in `assets/kenney/` includes its original `License.txt`. Research notes on the packs are in [`docs/research/kenney-city-kits.md`](docs/research/kenney-city-kits.md).

Built with [three.js](https://threejs.org), [React](https://react.dev), [Zustand](https://github.com/pmndrs/zustand), [Vite](https://vite.dev), [Vitest](https://vitest.dev), [fast-check](https://fast-check.dev) and [fflate](https://github.com/101arrowz/fflate).
