# BRT compatible indicator in the UI and the assets editor

Status: resolved
Blocked by: 01

## What to build

Players and map designers can see and set which buildings are BRT compatible (interface). See [spec](../spec.md).

## Acceptance criteria

- [x] "BRT compatible" badge on the build menu card
- [x] The placement ghost front marker changes when the BRT validates the position
- [x] The building panel states the access: road, BRT or both
- [x] `tools/assets-editor` exposes the access modes with a checkbox per mode
- [x] FR and EN strings in `src/i18n/messages.ts` and `fr.ts`, including the "road or BRT" placement error; no `undefined`
- [x] Render tests for the badge and the access line (prior art: existing build menu and panel tests)
- [ ] Ghost front checked by eye in the dev server (not done: no browser in this session)

## Comments
