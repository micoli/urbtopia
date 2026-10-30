# Baseball rules and Match simulation

Status: resolved
Spec: ../spec.md
Blocked by: 09

## What to build

Baseball rules on the Club engine: 9 starters, starting pitcher chosen per Match, batting order, 9 innings, pitcher change, simulation plug-in with the same contract as football.

## Acceptance criteria

- [x] Seeded, tested simulation.
- [x] Shares the engine with football with no engine change.

## Comments

The Club engine was not changed. The lineup of a baseball Club is ten ids: the starting pitcher, then the batting order. Decisions use the same `MatchDecision` as football, with `minute` read as the inning before which it applies; a pitcher change is only taken between innings. A tie after three extra innings goes to a seeded last at-bat.
