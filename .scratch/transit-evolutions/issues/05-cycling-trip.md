# Cycling trip and four-way mode split

Type: task
Status: ready-for-agent

## What to build

The aggregate Cycling trip over the Pedestrian path network and the cycling share of the mode split. See `../spec.md`.

## Seams under test

- Thresholds x3: a destination out of walking range but within cycling range gives a Cycling trip, never both for the same destination.
- Crossings are loaded by cyclists like pedestrians; Well-being and `walkAccess` count them.
- Commute: a workplace within cycling range creates no car demand, without a Congestion condition.
- Mode split: `modes` gains `cycling`; the shares sum to 1.

## Acceptance criteria

- [ ] `WALKING` thresholds derived by a cycling factor of 3, in game data or constants as for ADR 0023.
- [ ] City stats and Commute detail show the fourth mode (`ModeMix` included); texts in `en` and `fr`.
- [ ] No save change.
- [ ] Typecheck, lint and the full test suite pass.
