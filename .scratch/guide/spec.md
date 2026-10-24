# Guide (public website at /docs)

Status: ready-for-agent

The Guide presents every Codex entry and page and explains the game's mechanics, readable without playing. The in-game Codex stays as it is. See ADR 0040.

## Entry and build
- Second Vite entry (`docs/index.html` → `dist/docs/`), same build and deploy as the game. It loads neither the 3D scene, the game store nor the service worker.
- Reuses the game's definitions, i18n and the components of `src/ui/codex` (tables, charts).
- Every page is prerendered to static HTML at build time (`renderToString` in a build script) and hydrated on the client.
- URLs: `/docs/<lang>/<section>/<slug>`, e.g. `/docs/fr/codex/buildings/house`, `/docs/en/mechanics/energy`. `/docs/` redirects to the preferred language.
- The game's `sw.js` ignores every path under `docs/` (straight to the network, never cached). No offline mode for the Guide.

## Dynamic, never personal
- Content is generated from the game's definitions and stays in sync with them.
- Interactive: instant search, filters, Tier slider, colour selector, charts, small calculators.
- Never reads the player's save. Components that read the city today (`useGame`) get a neutral state built from reader settings.
- Reader settings: Difficulty (default Medium) and number of Citizens (default 0, so every unlock threshold shows). Kept in the query string so a link carries them.

## Information architecture
- **Getting started**: game loop, Urbs, Tiers, Citizens.
- **Mechanics**: one page per system. The 10 rule pages of today's Codex (economy, storage, energy, sanctions, market, challenges, solidarity, waste, politics, transit reach) become Mechanics pages, plus hand-written ones.
- **Codex**: one page per entry, grouped like today's Codex sections (buildings by build-menu section, roads, water, crops, trade, decoration, green spaces).
- **Glossary**: player-facing terms, hand-written, no technical detail. `CONTEXT.md` is never published.

## Content
- Mechanics, Getting started and Glossary pages are MDX, one file per page and per language, and can embed the live Codex components.
- A missing French page falls back to English with a "not translated yet" banner. The build fails only when the English page is missing.
- Languages en/fr with a switcher. The language preference is shared with the game.

## Codex entry pages
- PNG preview from `public/codex` by default, with a Tier and colour selector.
- A "View in 3D" button lazy-loads a turntable view of the `.glb` model. Three.js is loaded only on that click.

## Search
- A JSON index per language (title, summary, section, keywords) is produced at prerender time and loaded when ⌘K opens.
- Uses the accent-insensitive normalisation of the Codex's `matchesSearch`, with no new dependency.

## Theme
- Tailwind v4, a modern sans-serif font, a quiet palette with one accent colour.
- Light and dark from the system, with a manual toggle.
- Collapsible side navigation on mobile. Distinct from the game's dark UI; does not reuse `codex.css`.

## Links
- The in-game Codex has an "Open in the Guide" button that opens the matching page in a new tab.
- The Guide has a "Play" button to the game.

## v1 scope
- Foundation, theme, navigation, search, i18n, reader settings, every Codex entry and the 10 rule pages, 3D view, links, tests.
- Three hand-written Mechanics pages to validate the format: energy, mobility and congestion, waste.
- Every other mechanic is its own issue.

## Tests
- Vitest on the route catalogue: every Codex entry has a page, no duplicate slug, every page exists in English.
- Vitest on `sw.js`: paths under `docs/` are not intercepted.
- Playwright smoke test that visits every prerendered route without a console error.
- Visual baselines for 3 pages, light and dark.
