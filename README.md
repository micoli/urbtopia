# Urbtopia

A solo, serverless isometric city builder that runs in the browser, on phone, tablet and desktop. Produce Materials, turn them into Goods, sell them for Urbs, and spend the Urbs to grow a city of up to 160-Citizen Homes. Everything is saved on your device: no account, no server.

The vocabulary used in code and docs (Urbs, Workshop, Factory, Parcel, Catch-up…) is defined in [`CONTEXT.md`](CONTEXT.md).

## Features

- Isometric 3D city on a 128x128 map of 16x16 Parcels, with roads, roundabouts and crossings.
- Production chains: Workshops make Materials, Factories make Goods, Shops and the Market turn them into Urbs.
- Water to lay on your land: a Marina, Pleasure, Fishing and Casino boats, and drawbridges that open for them and stop the traffic.
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
| `npm run assets` | Install the 3D models into `public/models` (copies the hand-made and Poly Pizza models, converts the Quaternius ones) |
| `npm run assets:fetch` | Refresh the Poly Pizza models (see [Assets](#assets)) |
| `npm run assets:prototypes` | Copy the models the prototypes load (render-bench, touch-ux) |
| `npm run assets:editor` | Game editor: edit buildings (`assets/defs/`) and Model definitions (`assets/models.json`) with live validation, browse every model source, import assets |
| `?bypass-tutorial` (URL parameter) | Starts a new game without the tutorial; use it in end-to-end and Playwright tests, e.g. `http://localhost:5173/?bypass-tutorial` |
| `?keep-local` (URL parameter) | When the local city and the Cloud save diverged, keeps the local city without the Save conflict dialog; use it in end-to-end and Playwright tests, with `?bypass-tutorial` |
| `npm run storybook` | Storybook (port 6006, or `pitchfork start ur/storybook` on 5183): every UI primitive and panel, driven by game fixtures; see [docs/storybook.md](docs/storybook.md) |
| `npm run build-storybook` / `npm run test:storybook` | Build the static Storybook, then open every story and fail on a crash or an empty render |
| `npm run casino:sim` | Casino simulator: play each Minigame with 100 000 Urbs, one URL per game (`/slot-machine`, `/blackjack`, `/blockmatch`, optional `?tier=`) |
| `npm run codex:generate` | Generate static codex images; append `-- --force` to regenerate |
| `npm run test:codex` | Browser checks against a production build, including mobile and offline access |
| `npm run test:codex:images` | CI check that every codex image exists in the production build and is served |

`dev` and `build` prepare models and codex previews first. Models come from the files committed under `assets/`; the preview generator uses local Chromium and reuses unchanged output. After installing dependencies and Chromium, these steps work offline.

The codex catalog is checked against every building in `BUILDING_SPECS` and every network tool in the shared construction registry. Adding a constructible requires a section, French and English descriptions, and a preview for every Tier. Missing entries, translations, models or generated images block CI and deployment. CI checks image availability only, without checking pixels, dimensions or visual accuracy. Generated images and their manifest live in `public/codex/`, are excluded from Git, and are included in the offline cache.

## Local stack (Docker and pitchfork)

The full local environment is the game and tools run by [pitchfork](https://pitchfork.jdx.dev) (see [`pitchfork.toml`](pitchfork.toml)) plus the Supabase stack and a dev index page run by Docker. You need a Docker-compatible runtime running (Docker, OrbStack, Colima).

```sh
mise install                    # pinned Node, pitchfork, Supabase CLI, gitleaks
cp .env.example .env.local      # local Supabase URL and public demo key (skip to play without the Cloud save)
npm run db:start                # docker compose: Postgres, Auth, REST, Studio, Mailpit, index page
pitchfork start ur/dev ur/assets-editor ur/casino-sim
```

Then open the index: **http://127.0.0.1:5170/**. It lists every service below with a dot showing which ones answer.

| Service | URL | Started by |
|---|---|---|
| Dev index | http://127.0.0.1:5170/ | `npm run db:start` |
| Game | http://localhost:5175/ | `pitchfork start ur/dev` |
| Assets editor | http://localhost:5181/ | `pitchfork start ur/assets-editor` |
| Casino simulator | http://localhost:5182/ | `pitchfork start ur/casino-sim` |
| Pitchfork dashboard | http://localhost:3120/ | pitchfork (start and stop daemons from there too) |
| Supabase Studio | http://127.0.0.1:54323/ | `npm run db:start` |
| Mailpit (emails sent by Auth) | http://127.0.0.1:54324/ | `npm run db:start` |
| Supabase API | http://127.0.0.1:54321 | `npm run db:start` |

Stop everything with `pitchfork stop ur/dev ur/assets-editor ur/casino-sim` and `npm run db:stop`. Without pitchfork, `npm run dev` serves the game on http://localhost:5173 instead.

## Cloud saves database

The optional Cloud save lives in a Supabase project described by [`supabase/`](supabase/) (migrations, pgTAP tests, email templates); every Postgres object is prefixed `urb_`. Locally it runs from [`docker-compose.yml`](docker-compose.yml) (Postgres, Auth, REST, a small gateway, Mailpit and Studio, same ports as `supabase start`), which needs a Docker-compatible runtime (Docker, OrbStack, Colima). Migrations are applied when the stack starts. The same database holds the Hall of fame: a public Showcase of each opted-in city, readable by every signed-in player (see [ADR 0029](docs/adr/0029-hall-of-fame-trusts-the-client-with-growth-caps.md)).

| Command | Purpose |
| --- | --- |
| `npm run db:start` / `db:stop` | Start or stop the local stack |
| `npm run db:migrate` | Apply the new migrations to the running local database, keeping its data, and reload the REST schema |
| `npm run db:reset` | Wipe the local database and re-apply the migrations |
| `npm run db:test` | Run the pgTAP tests in `supabase/tests/database/` |
| `npm run db:lint` / `db:types` | Lint the schema / regenerate `database.types.ts` (need the Supabase CLI: `mise install`) |

Open http://localhost:5170 (served by the compose from [`dev/index/index.html`](dev/index/index.html)) for a page of links to the game, the tools, Studio and Mailpit, with a dot showing which ones are up. Copy `.env.example` to `.env.local` to try the Cloud save; the game is fully playable without Supabase. CI and production deploys use the Supabase CLI (pinned in `mise.toml`) with `supabase/config.toml`. See [`docs/security.md`](docs/security.md) for what is public and what is secret.

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

Most 3D models are made in Blender from Python recipes and versioned as GLB in `assets/managed-models/<theme>/<name>/` (one folder per model: GLB, .blend, and the recipe or the shared recipe of its family). `npm run assets` copies them as is to `public/models/<theme>/`, which is generated and ignored by git, so installing and building never need the network.

Crops and farm buildings come from two Quaternius packs, versioned in `assets/quaternus/`. They ship FBX only, so `npm run assets` converts the models the scene uses to GLB (scaled to one tile) with the three.js FBX loader, keeping a single GLTF loader at runtime.

A few models come from Poly Pizza, versioned in `assets/poly.pizza/` with their license; `npm run assets:fetch` refreshes them. The assets editor (`npm run assets:editor`) reads every source directly, including Quaternius packs with no models selected for the game.

The [`prototypes`](prototypes) folder holds throwaway prototypes (render benchmark, touch UX, casino simulator) that informed the design. Only their sources are versioned; `npm run assets:prototypes` copies the models they load.

## Credits

3D models: made for the game, unless listed below. The look of many of them is inspired by the **[Kenney](https://kenney.nl)** kits.

3D models of crops and farm buildings: **[Quaternius](https://quaternius.com)**, released under CC0 1.0 Universal (public domain), from the Farm Crops and Farm Buildings packs.

Models from Poly Pizza are credited one by one in the game's Credits dialog.

Built with [three.js](https://threejs.org), [React](https://react.dev), [Zustand](https://github.com/pmndrs/zustand), [Vite](https://vite.dev), [Vitest](https://vitest.dev), [fast-check](https://fast-check.dev) and [fflate](https://github.com/101arrowz/fflate).
