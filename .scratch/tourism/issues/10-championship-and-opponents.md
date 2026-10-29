# Championship calendar and opposing clubs

Status: resolved
Spec: ../spec.md
Blocked by: 01, 05, 09

## What to build

Yearly Championship with about 10 Matches, 7 aggregate opposing clubs with invented names and a drifting strength, ranking and end-of-year prize in Urbs plus extra Tourists. Matches become Gatherings in the stadium.

## Acceptance criteria

- [x] Calendar deterministic from the game clock, replayed by catch-up.
- [x] Ranking and prize tested; no relegation.
- [x] Athletics has isolated meetings with no ranking.

## Comments

Match interval is 6 real hours (a Championship lasts 60 hours), not the 12 minutes first sketched: a Gathering lasts hours and its crowd moves for an hour before and after, so Matches 12 minutes apart would overlap. A play session replays at most 48 hours, so a Championship spans several sessions. The numbers sit in `CHAMPIONSHIP` and can be tuned.
