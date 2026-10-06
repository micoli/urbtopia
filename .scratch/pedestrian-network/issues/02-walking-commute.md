# Walking commute

Status: ready-for-agent
Blocked by: 01

## What to build

Commuters whose job assignment has a pedestrian path under the work threshold walk instead of drive, removing them from the road load.

## Acceptance criteria

- [ ] Job assignment unchanged (nearest first, stable order); mode chosen per assignment
- [ ] Work walking threshold (10) in `GAME_CONFIG`
- [ ] Walking Commuters add no car load and no Congestion penalty
- [ ] Modal shift only draws from car Commuters: a Rider is never also a walker
- [ ] Statistics expose walking Commuters and the mode shares (car, public transport, walking) summing to 100%
- [ ] Existing statistics keep their meaning; old tests still pass
- [ ] Unit tests: walker removed from load, no walker also a Rider, determinism across calls and catch-up

## Comments
