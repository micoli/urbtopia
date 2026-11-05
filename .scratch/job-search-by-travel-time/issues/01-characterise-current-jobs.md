# 01: Characterise today's Jobs and Rider behaviour

Status: done
Blocked by: none

**What to build:** A fixture city and tests that pin the behaviour to be changed, so that every later ticket shows exactly what moved. No production code changes.

- [ ] A test city (built in code, not a save file) reproduces the "Robbart" shape: Homes served by a Metro, walkable workplaces, workplaces far from any Home, an Office, a Hardware store.
- [ ] Tests record today's filled Jobs per workplace, Unemployed, `modes` (car, transit, walking, cycling) and the Rider share.
- [ ] A test names the anomaly: Riders fill no Job in a workplace reached by Road and covered by a station.
- [ ] The figures of `idealCity` and `evolvedCity` that the later tickets will move are listed in the ticket Comments.

## Comments

- Folded into the new tests: `jobSearch.test.ts` pins the new behaviour, and the Robbart save r354 (951 Jobs, 300 filled before) is recorded in `.scratch/traffic-congestion/balancing.md`. No separate characterisation fixture was kept.
