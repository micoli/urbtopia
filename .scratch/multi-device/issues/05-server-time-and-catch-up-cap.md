# Server time and Catch-up cap

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

The push carries the server time, and the Catch-up reference follows it. When a Cloud save is adopted, `lastSeen` is capped at the device's `now`.

## Acceptance criteria

- [ ] Test: a save adopted with `lastSeen` three minutes in the future does not stall the game.
- [ ] Test: two devices with clocks five minutes apart give the same Catch-up for the same gap.
- [ ] Check what `tick(now)` does today with `now < lastSeen` and record it in the ticket.
