# Rail Access mode and Transit hub building

Type: task
Status: ready-for-agent

## What to build

`rail` as an Access mode and the Transit hub building with its placement rules. See `../spec.md` and ADR 0038.

## Seams under test

- Placement: a hub is valid when it touches Road, BRT, Railway, Pedestrian way or Sidewalk; invalid when it touches none.
- A hub touching only pedestrian networks is flagged inactive and covers no Home.
- `accessModes` accepts `rail`; removing the last access of a building is still refused for every mode.
- Front choice with several networks; the Road wins by default.

## Acceptance criteria

- [ ] `assets/defs/buildings/transitHub.json` (3x2, 1500 Urbs, 1000 Citizens, `build.transport`), schema updated.
- [ ] Building art through the `add-building` and `create-building-model` skills, one building at a time.
- [ ] `en` and `fr` names and descriptions.
- [ ] Typecheck, lint and the full test suite pass.
