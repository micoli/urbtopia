# Server time and Catch-up cap

Status: done - partly (server time deferred)
Spec: ../spec.md
Blocked by: 01

## What to build

The push carries the server time, and the Catch-up reference follows it. When a Cloud save is adopted, `lastSeen` is capped at the device's `now`.

## Acceptance criteria

- [ ] Test: a save adopted with `lastSeen` three minutes in the future does not stall the game.
- [ ] Test: two devices with clocks five minutes apart give the same Catch-up for the same gap.
- [ ] Check what `tick(now)` does today with `now < lastSeen` and record it in the ticket.

## Notes

`advance` takes `Math.max(now, lastSeen)` as its clock, so a save whose `lastSeen` is ahead of the device made the game stand still until the device clock caught up. `rebaseClock` (core, `engine/advance.ts`) now brings `lastSeen` and the running timers back to `now` when a Cloud save is adopted (`installCloud`).

Not done: the server time as the Catch-up reference. A save written by a device whose clock runs behind still replays the gap, at most the skew. Doing it right needs every `Date.now()` of the game loop (26 files) to read a corrected clock, or the envelope to carry the writer's offset; neither is worth it before clock skew is seen in practice. The acceptance line "two devices with clocks five minutes apart give the same Catch-up" stays open.
