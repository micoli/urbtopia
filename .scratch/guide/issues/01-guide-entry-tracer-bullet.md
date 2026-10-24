# 01: Guide entry end to end

**What to build:** `/docs/` serves a prerendered, hydrated Guide page for one Codex entry (Home) in English and French, built and deployed with the game, without breaking the game's offline cache.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Second Vite entry `docs/index.html`, output in `dist/docs/`; its bundle contains no Three.js nor game store.
- [x] Build script prerenders each route to static HTML with `renderToString`, then the client hydrates.
- [x] Routes `/docs/en/codex/buildings/home/` and `/docs/fr/codex/buildings/home/`; `/docs/` redirects to the preferred language.
- [x] Works on GitHub Pages with `base: './'` (relative asset paths from nested routes).
- [x] `sw.js` lets every path under `docs/` through to the network, never cached; Vitest covers it.
- [x] `npm run build` and the deploy workflow produce and publish `dist/docs/`.

## Comments

- Shell `docs/index.html`, sources in `src/guide/`, prerender in `scripts/prerender-guide.ts` (runs after `vite build`, refuses an already prerendered template).
- Dev server: `build/guideDevFallback.ts` serves the shell for nested `/docs/...` paths; pages render client-side from `codex/manifest.json`.
- `npm run check:bundle` fails if a script loaded by the Guide contains Three.js.
- Unknown `/docs/...` paths are a plain 404 on the static host.
