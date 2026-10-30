# Football rules and Match simulation

Status: resolved
Spec: ../spec.md
Blocked by: 09

## What to build

Football positions, 4 formations, 18 players and 11 starters, tactic changes, 3 substitutions, a Match simulation plug-in returning an event stream and a result from two lineups.

## Acceptance criteria

- [x] Simulation is seeded and tested for monotonicity in ratings.
- [x] Plug-in contract documented in the engine.
- [x] No DOM import.

## Comments

The plug-in contract is `SportRules.playMatch(club, opponent, seed, decisions)` returning the result and score. The seed of a Match is `fixtureSeedOf(club, index)`, so the management page can replay it minute by minute with `playUntil`. Decisions taken during a Match are stored on its fixture (`decisions`); the command that records them comes with the management page (ticket 12). Opposing clubs field eleven players at their strength.
