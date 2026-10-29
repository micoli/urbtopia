---
status: accepted
---

# Clubs: one engine, one set of rules per sport

The football stadium and the baseball field each host a Club the player runs from a management page. Both run on a single sport-agnostic Club engine: Squad, contracts, budget, Championship calendar, ranking and prize. A sport only supplies its own rules: positions, formations or batting order, and the Match simulation. A third sport (basketball, rugby) is added by writing its rules, never by touching the engine.

The Club is modelled at simulator depth from the first version. Each player is an individual with an id, an age, a contract (length and wage), a history of Championships and injuries. The first version exposes only a subset: Squad, starting lineup and one yearly recruitment of 6 players from a market. A full transfer market (windows, offers, sales, loans, expiring contracts) is added later without changing the save format.

The opposing clubs of a Championship are, at first, aggregate entries with an invented name and a strength from 1 to 100 that drifts slowly, with no Squad. They can later become real Clubs with their own Squads, through the same Club model as the player's.

## Why

- A separate engine per sport was rejected: contracts, budget, calendar and ranking would be written twice and drift apart.
- A shallow Club (a team rating and a budget) was rejected: moving to individual players and contracts later would force a migration of every save.
- The yearly recruitment of the first version is already a minimal transfer window, so the full market grows from it instead of replacing it.

## Consequences

- Saves carry individual players from the start, which costs a little size and nothing else.
- The Match simulation is a plug-in with a fixed contract: given two lineups and tactics, it returns a stream of events and a result. Each sport owns its own tests.
- The Club engine knows nothing about stadiums, Tourists or Urbs flows: the stadium reads the Club's results (Fame, ranking, prize) through a narrow interface, so the Attraction side of the city can change without touching the Club.
- Opposing clubs and the full market are explicitly deferred, not forgotten: the Club model must stay able to host them.
