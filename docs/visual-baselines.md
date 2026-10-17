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

Cities come from `scripts/visualScenes.ts` (fixed seed, fixed fill order, no engine rules involved), loaded with `/?bypass-tutorial&keep-local` and `replaceState`. `Math.random` is seeded, traffic, pedestrians and service vehicles are off, the viewport is 1280x800 at scale 1, and CSS animations are disabled. Chromium runs with SwiftShader so the GPU does not matter.

## Platforms

Playwright keeps one baseline per OS (`*-darwin.png`, `*-linux.png`). The macOS ones are committed. For Linux, run the "Visual baselines" workflow by hand with `update` checked, download the `visual-baselines-linux` artifact and commit its PNGs; after that the workflow without `update` compares against them. It is manual on purpose: it does not slow the regular pipeline.
