# 01: Guide entry end to end

**What to build:** `/docs/` serves a prerendered, hydrated Guide page for one Codex entry (House) in English and French, built and deployed with the game, without breaking the game's offline cache.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Second Vite entry `docs/index.html`, output in `dist/docs/`; its bundle contains no Three.js nor game store.
- [ ] Build script prerenders each route to static HTML with `renderToString`, then the client hydrates.
- [ ] Routes `/docs/en/codex/buildings/house` and `/docs/fr/codex/buildings/house`; `/docs/` redirects to the preferred language.
- [ ] Works on GitHub Pages with `base: './'` (relative asset paths from nested routes).
- [ ] `sw.js` lets every path under `docs/` through to the network, never cached; Vitest covers it.
- [ ] `npm run build` and the deploy workflow produce and publish `dist/docs/`.
