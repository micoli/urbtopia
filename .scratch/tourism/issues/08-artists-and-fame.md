# Artists and Fame ceiling

Status: resolved
Spec: ../spec.md
Blocked by: 04, 05

## What to build

Ship the 100 Artists of `.scratch/tourism/artists.json` as game data. Fame ceiling follows mean Well-being and population. Programming a Concert hall Show offers 3 Artists drawn at or under the ceiling; Fame raises crowd, Ticket and fee.

## Acceptance criteria

- [x] Data moved under assets with a schema; names stay invented.
- [x] Draw is deterministic from a seed saved with the Show offer.
- [x] Tests: ceiling monotonic in Well-being and population; offer never above ceiling.
