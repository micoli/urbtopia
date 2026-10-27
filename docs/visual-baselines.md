# Visual baselines

Four reference scenes, each a Playwright screenshot compared with a committed baseline in `e2e-baselines/`:

| Scene | What it shows |
|---|---|
| `dense-city` | a packed city: every road lot filled with buildings of mixed Tiers |
| `map-edge` | the north-west corner of the map: owned parcels, the wild land around them |
| `build-menu` | the Build menu open on "Énergie et eau" (canvas hidden: the panel only) |
| `venue` | an empty Arcade interior |

`npm run test:visual` compares, `npm run test:visual:update` rewrites the baselines on purpose. Review the changed PNGs before committing them.

## Determinism

Cities come from `scripts/visualScenes.ts` (fixed seed, fixed fill order, no engine rules involved), loaded with `/?e2e` and `replaceState`. `Math.random` is seeded, traffic, pedestrians and service vehicles are off, the viewport is 1280x800 at scale 1, and CSS animations are disabled. Chromium runs with SwiftShader so the GPU does not matter.

## Platforms

Playwright keeps one baseline per OS (`*-darwin.png`, `*-linux.png`). The macOS ones are committed. For Linux, run the "Visual baselines" workflow by hand with `update` checked, download the `visual-baselines-linux` artifact and commit its PNGs; after that the workflow without `update` compares against them. It is manual on purpose: it does not slow the regular pipeline.

## Guide

`npm run test:guide` runs against the built site (`npm run build` first, served by `vite preview`): it visits every prerendered Guide page and fails on any console error, page error or failed request, then compares three pages (`guide-home`, `guide-codex-entry`, `guide-mechanics`) in light and dark with their baselines in `e2e-baselines/guide.e2e.ts-snapshots/`. `npm run test:guide:update` rewrites them.

The workflows that drive a browser (Visual baselines, Storybook, and the Pages build that renders the Codex and Avatar images) run in the official `mcr.microsoft.com/playwright` image, pinned to the installed Playwright version and by digest: no system packages are installed during the job, and the fonts are those of the image. A test keeps the tag equal to the installed version, so a Playwright upgrade means updating the three `image:` lines (the digest comes from `docker buildx imagetools inspect mcr.microsoft.com/playwright:vX.Y.Z-noble`). Linux baselines generated before this switch, on a bare runner, must be regenerated; none is committed today.
