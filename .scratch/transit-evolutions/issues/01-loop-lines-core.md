# Loop lines in the core

Type: task
Status: ready-for-agent

## What to build

The `loop` flag on lines of every mode and its route resolution. See `../spec.md`.

## Seams under test

- `resolveRoute` with `loop`: closing section computed, `disconnected` when it is not connected, `invalid` under 3 stops.
- Itineraries on a loop follow the direction only (`transport.ts`): the previous stop is reached by going around, offsets and travel time include the closing section.
- Capacity, effective speed and bus traffic use the full loop length.
- Command to set or clear `loop` on a line; validation rejects `loop` with fewer than 3 stops.
- Save: absent `loop` means not looped, `validate.ts` accepts the field, no migration.

## Acceptance criteria

- [ ] `BusLine.loop?: boolean`, used by Bus, BRT and Railway lines.
- [ ] A looped line has a route ending where it started, with the closing offset.
- [ ] A non-looped line behaves exactly as before; existing tests unchanged.
- [ ] Typecheck, lint and the full test suite pass.
