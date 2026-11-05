# 03: Public transport itineraries reach every workplace

Status: done
Blocked by: 01

**What to build:** `transportStats` computes its itineraries towards every workplace (Offices, Public facilities, Leisure buildings and Venues included), not only Workshops, Factories, Shops and BRT-only workplaces, and says which workplaces a Home can reach and in how many minutes.

- [ ] `coveredActivities` and the trips of Riders include every workplace; the Services trips are unchanged.
- [ ] A Home exposes its reachable workplaces with their Travel time, for ticket 04 and 05 to read.
- [ ] Benchmark: the cost of `transportStats` on `idealCity` and `evolvedCity` stays within the budget agreed in the ticket Comments (measure first; investigate caching in `layoutSignature` if over).
- [ ] Vitest: an Office within a stop's radius is covered; a workplace out of range is not.

## Comments

- `transitNetwork` in `src/core/transit/transport.ts` computes itineraries to every workplace and exposes the options of each Home; `transportStatsOf` builds the lines from the Riders the Commute allocated. `coveredActivities` keeps its old meaning for the shops. Timings: 1 to 9 ms on the sample cities (see balancing.md).
