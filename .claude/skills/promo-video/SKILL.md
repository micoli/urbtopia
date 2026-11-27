---
name: promo-video
description: Film a promotional video of Urbtopia from a scenario the user describes. Writes the scenario in scripts/promo/scenarios, plays it in a headed browser, checks key frames, fixes the scenes and assembles the MP4. Use when the user wants a demo, trailer or promo video of the game.
---

# Promo video

Engine and rules: ADR 0097, `docs/agents/promo-videos.md`. The user describes the scenario in French; you write it, film it, check it and assemble it.

## Steps

1. Ask only what is missing: the scenes in order, the start City of each (a file of `saves/`, or one the user exports), the language of the game and of the captions (default `en`), music if any.
2. Check the dev server answers on `http://127.0.0.1:5175` (never stop it). If not, ask the user to start it.
3. Write `scripts/promo/scenarios/<name>.promo.ts` (default export of `scenario(name, scenes, audio?)`). English captions, short. See `tour.promo.ts`.
4. Film one scene: `node scripts/promo/cli.ts <name> --scene=<scene>` (add `--fresh` after a visual change of the game). The browser opens headed; leave it alone.
5. Extract key frames of the scene (`ffmpeg -ss <s> -i tmp/promo/<name>/<scene>.<hash>.webm -frames:v 1 frame.png` in the scratchpad) and look at them: caption readable, no banner or dialog in the way, the cursor on its target, the right City. Fix the scene and film it again until it is right.
6. Assemble: `node scripts/promo/cli.ts <name>`. Output: `tmp/promo/<name>.mp4`. Tell the user the path, the duration and what could not be checked.

## Rules

- The tax bubbles ("25 U") that float over the buildings can crowd a shot: if they do, set `hideTaxBadges: true` in the scene options. Keep them when the scene is about taxes or income.
- Workshop interior: a working line is Extractor (item chosen) + Storage bin + Pump + Tank + Motor, with a restocker hired and assigned to the bin (`HireInteriorStaff`, `AssignInteriorStaff`). Leave the Slots of that Workshop empty: a Slot queue (Wood, Stone) keeps the restocker from storing anything. The proof is `state.storage.materials.wood` growing (`scenarios/workshop.promo.ts`).
- Test a scenario with `node scripts/promo/cli.ts <name> --fast` first: no pauses, no cursor travel, no video, no assembly. In a `.promo.ts`, `stage.fast` tells the mode and `stage.cinematic(async () => { ... })` wraps what is only there to look good (a `circle`, a long pause, a closing shot); `--fast` skips it, while every `stage.check` still runs. `PROMO_TRACE=1` prints the time of each verb.
- Every set-up shown must WORK, never be a decor: a machine connected to its Drive and its Flow, an item chosen on an extractor, Staff where needed, and a measured effect (rates above zero, stock that grows). A promo that shows a dead Workshop misleads viewers and is rejected. After filming, check it: read the state or the HUD figures (`window.__gameStore`) and look at the key frames for the figures moving. If the numbers stay at zero, fix the set-up before assembling.
- An interior is fitted out with `placeFixture` (`scripts/promo/interior.ts`), not by hand-written selectors; see `scenarios/workshop.promo.ts`. The Citizens an interior needs come from a start state such as `states/early-city.json`.
- The mouse cursor is a pointer for the viewer: use `stage.point(target)` to rest on a widget and `stage.circle(target)` to loop around it, to show or put forward a widget of the game (a stat, a button, a panel row) before or instead of clicking it. Pair it with a short caption.
- The interface is hidden by default: list in `ui` only what the scene presents (the main menu always stays), and show the build menu or the panel (`stage.ui(...)`) just before the click that needs it, then hide it again.
- Never publish or upload the video.
- Click verbs go through `getByRole` names in the language of the scene.
- A time-lapse shows the Day cycle going round; `pinCycleHour` or a scene `time` option pins the light for a Night shot.
- Commit nothing unless the user asks.
