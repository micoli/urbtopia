---
name: promo-video
description: Film a promotional video of Urbtopia from a scenario the user describes. Writes the scenario in scripts/promo/scenarios, plays it in a headed browser, checks key frames, fixes the scenes and assembles the MP4. Use when the user wants a demo, trailer or promo video of the game.
---

# Promo video

Engine and rules: ADR 0097, `docs/agents/promo-videos.md`. The user describes the scenario in French; you write it, film it, check it and assemble it.

## Steps

1. Ask only what is missing: the scenes in order, the start City of each (a file of `saves/`, or one the user exports), the language of the game and of the captions (default `en`), music if any.
2. Check the dev server answers on `http://127.0.0.1:5175` (never stop it). If not, ask the user to start it.
3. Write `scripts/promo/scenarios/<name>.promo.ts` (default export of `scenario(name, scenes, audio?)`). English captions, short. See `workshop.promo.ts` (one short scene) and `start.promo.ts` (a long film, one private method per sequence).
4. Film one scene: `node scripts/promo/cli.ts <name> --scene=<scene>` (add `--fresh` after a visual change of the game). The browser opens headed; leave it alone.
5. Extract key frames of the scene (`ffmpeg -ss <s> -i tmp/promo/<name>/<scene>.<hash>.webm -frames:v 1 frame.png` in the scratchpad) and look at them: caption readable, no banner or dialog in the way, the cursor on its target, the right City. Fix the scene and film it again until it is right.
6. Assemble: `node scripts/promo/cli.ts <name>`. Output: `tmp/promo/<name>.mp4`. Tell the user the path, the duration and what could not be checked.

## Languages: every video exists in English and French

- A scenario is `scenario(name, (language) => [scenes], options)`: the function is called once per language and returns the scenes with their captions and lines in it. Keep the words in a `TEXT = { en: {...}, fr: {...} }` object (captions, narration, labels of callouts and stats, the tagline). `node scripts/promo/cli.ts <name>` films and assembles both; `--lang=en|fr` does one. Outputs: `tmp/promo/<name>.en.mp4`, `<name>.fr.mp4` (`.phone` before `.mp4` for the portrait format). Both languages must pass their `stage.check`s: test with `--fast` first.
- A selector never holds a text of the game. Use `await stage.label('panel.interior')` (the game's own message key, in the language of the scene), a class (`.dock-button`, `.flyout-row`, `.venue-build`), an id suffix (`[id$="-machines-toggle"]`) or `data-choice="<fixture id>"`.
- French narration: the game's own terms (an `employé de réassort`, un `entrepôt`, un `atelier`), short spoken sentences, never a word-for-word copy. The tagline is shown on the opening and closing cards.

## Music

The music bed is `scripts/promo/assets/mythica.mp3`, "Mythica" by congusbongus, CC0 (https://opengameart.org/content/mythica); it is mixed under the voice automatically (low volume, fade in and out) and credited on the closing card with `MUSIC_CREDIT[language]` (`scripts/promo/credits.ts`, `assets/CREDITS.md`). Always close a video with the title card and its `note: MUSIC_CREDIT[language]`. A scenario can bring its own track with the option `audio`.

## Voice over (Kokoro in Docker)

`stage.say('line')` speaks a line over the picture. The voice is Kokoro (82M, StyleTTS 2) served by Kokoro-FastAPI, an OpenAI-compatible endpoint (`POST /v1/audio/speech`), on `http://localhost:8880` (`KOKORO_URL`).

- The engine uses the server that answers; otherwise it starts the CPU image `ghcr.io/remsky/kokoro-fastapi-cpu:v0.10.0` as the container `urbtopia-kokoro` (`docker run -d -p 8880:8880`). Docker must run. The first synthesis of a line takes a few seconds; a line already spoken comes from `tmp/promo/voice/` (named by the hash of text, voice and speed).
- Default voice: `af_heart` for `en`, `ff_siwis` for `fr`. Override with the scene option `voice` (`am_michael`, `bf_emma`... list: `GET /v1/audio/voices`).
- A line never overlaps the previous one. `say(text)` waits for the end of the line; `say(text, { wait: false })` lets the action go on while the voice speaks, and `stage.endOfSpeech()` waits for the last line before a scene ends. Write the narration so the action lasts as long as the line.
- Under `--fast` nothing is synthesised and `say` returns at once.
- Narration: short spoken sentences, present tense, one idea per line, the words of `CONTEXT.md`, no read-aloud of the captions. A caption names, the voice explains.

## Effects

Use few, and one hero moment per scene. All are drawn in the page, so they are filmed with the game.

- `stage.title('Urbtopia', { subtitle, seconds })`: full-screen title card, blur-to-sharp reveal over a glow. Open with it and close with it (leave the closing card 3 s or more).
- `stage.caption(text, ms?, mode?, wordMs?)`: the default mode is `'viral'`, the subtitle of short videos: uppercase, heavy outlined letters, three words at a time, each word pops in and takes the yellow highlight (`wordMs`, 260 by default, is the pace of the words; slow it for a slow voice), a slight tilt that changes with each chunk; the last chunk goes away by itself after its beat, so a viral caption needs no `hideCaption`. Other modes: `'words'` (words fade in), `'typewriter'` (typed with a caret), `'plain'` (a static pill, for text people must read at their own pace). Keep a caption to 6 to 9 words so it ends with the line; a caption is not the sentence of the voice, it is its punch.
- `stage.callout(target, 'label')` / `stage.clearCallout()`: dims the picture except the widget, a ring pulses around it. Stronger than `circle`; use it for the one thing to look at.
- `stage.point(target)` and `stage.circle(target)`: the cursor shows a widget.
- `stage.stat('Wood stored', 20, { from, seconds, suffix })`: a big figure counting up, with a pop when it lands. Land a number the viewer must remember.
- `stage.focusTile(x, y, zoom, seconds)` / `flyTo`: camera moves; zoom in on the building in action, pull back to close.
- `stage.timelapse({ hours, seconds })`: time passing; the Day cycle turns.
- Between scenes the assembly fades through black (0.35 s); `scenario(name, scenes, { transition: 'cut' })` for plain cuts, `{ audio: 'music.mp3' }` for a music bed mixed under the voice.
- A light vignette is always on (`__promo.look(false)` removes it).

## Pacing

- The first 3 to 5 seconds decide whether the viewer stays: open on the title and the first action, never on a pause.
- 2 to 4 seconds per beat; do not animate text people have to read, let it appear and stay.
- A pause (1 to 2 seconds of stillness) before the payoff makes it land: the Storehouse that fills up, the number that counts up.
- Keep one motion language: the same camera zoom levels and the same ease for similar moments.

## Formats

`--format=phone` films the same scenario in portrait (720×1280) into `<name>.phone.mp4`; every `stage.check` still runs. The zooms of `focusTile` / `flyTo` are written for the landscape width and scaled to the width of the format, so the same stretch of the city shows. In portrait the side panels and the build menu cover a large part of the picture: `stage.portrait` tells the format, `stage.shiftRoom(dx, dy)` moves the open interior room clear of them, and `placeFixture` hides the fixture panel once a piece is turned. Always check the key frames of a portrait video.

## Rules

- Prefer the floating menus to the side panels: act through the floating bar of the selected building (`.building-floating-bar`: collect, interior, move, rotate, sell) and the floating toolbar of a fixture (`.venue-fixture-toolbar`: move, rotate, repair, sell), shown with the `selection` part of `ui`. Open a side panel (`panel`) only for what has no floating control: the recipe Slots of a Workshop, the item of an extractor, reading a stock. Hide it again right after.
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
