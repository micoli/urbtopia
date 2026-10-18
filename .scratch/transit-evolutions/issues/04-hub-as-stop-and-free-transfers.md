# Hub as a stop of each mode and free Transfers

Type: task
Status: ready-for-agent
Blocked by: 03

## What to build

Lines of every mode can use a Transit hub as a stop, and Transfers inside a hub are free. See `../spec.md`.

## Seams under test

- `resolveRoute` accepts a hub as a stop of the line's mode, with the front tile on that network.
- A hub appears once per line; a bus line and a rail line may share it.
- Itineraries: a Transfer inside a shared hub ignores the 2-tile rule and costs no walking distance; it still counts towards the 2-Transfer maximum.
- Coverage: hub stops cover Homes and activities like other stops of the same mode.

## Acceptance criteria

- [ ] Existing Bus, BRT and Railway tests unchanged.
- [ ] Test: Home on a bus line, activity on a rail line, joined only by the hub.
- [ ] Typecheck, lint and the full test suite pass.
