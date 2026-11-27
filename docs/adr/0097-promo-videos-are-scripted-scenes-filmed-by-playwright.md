---
status: accepted
---

# Promo videos are scripted scenes filmed by Playwright

Promotional videos of the game must be repeatable: a scenario is written once, then replayed after a change of the game, from a known City, with time passing fast.

## Decision

- **A scenario is TypeScript, not data.** `scripts/promo/scenarios/<name>.promo.ts` lists scenes; each scene is a function over a `Stage` of verbs (`caption`, `click`, `drag`, `zoom`, `flyTo`, `timelapse`, `skip`, `send`). Types catch a wrong verb before a long recording.
- **Each scene is filmed on its own, in real time**, by the `recordVideo` of Playwright in a headed Chromium, from a saved City given as its start state. A scene is cached by the hash of its code, options, state and engine sources; the game sources are left out, `--fresh` films again. ffmpeg trims the load, re-encodes to H.264 and concatenates.
- **The game side is a dev-only module under `?promo`**: a fake cursor that follows the real mouse, caption overlays, a state loader and the in-page time-lapse. `?promo` behaves as `?e2e` (no banner, no tutorial) and lights the map as Daytime except during a time-lapse. It lives in `src/devtools/promo/`, loaded by a dynamic import in development only.

## Consequences

- `recordVideo` gives a low, fixed bitrate and about 25 images per second; the final encode cannot add detail, and a scene is only as smooth as the machine renders it. Frame-by-frame capture would be smoother but was not chosen.
- Scenes do not continue one another: a raccord goes through a saved City.
- The promo engine needs the dev server running (`PROMO_URL`, default `http://127.0.0.1:5175`).
