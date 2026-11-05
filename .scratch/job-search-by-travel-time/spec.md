# Job search by travel time

Status: implemented

Follow-up to [traffic-congestion](../traffic-congestion/spec.md) and [traffic-congestion-followups](../traffic-congestion-followups/spec.md). The decision is [ADR 0059](../../docs/adr/0059-every-citizen-looks-for-a-job-and-picks-the-mode-by-travel-time.md), which amends [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md) and [ADR 0041](../../docs/adr/0041-office-buildings-earn-urbs-from-filled-jobs.md). Vocabulary (**Commute**, **Job**, **Unemployed**, **Travel time**, **Mode choice**, **Rider**, **Commuter**, **Adaptation period**) is in `CONTEXT.md`.

## Problem Statement

In the "Robbart" city (save r354): 1,000 Citizens, 951 Jobs, 700 Citizens on the Metro. Only the 300 who walk or cycle fill Jobs, so 651 Jobs are unfilled, a Hardware store has nobody, an Office earns nothing and Unemployed reads 0. The player cannot understand why: the Commute was built to measure road load, so Citizens who do not drive never fill a Job, and the share of Riders is a fixed 70% rather than a result.

## Solution

Every Citizen of a Home looks for a Job. Walkers are served first city-wide, then Cyclists, then everyone else, who takes public transport or the car, whichever has the shorter Travel time. The car's Travel time is slowed by Congestion. Riders reach every kind of workplace. Citizens who find no Job are Unemployed, a statistic only. The fixed 70% Rider share and the Modal shift are removed. Saved cities get an Adaptation period.

## User Stories

1. As a player, I want the Citizens who ride public transport to fill Jobs, so that a well-served city is not shown as under-employed.
2. As a player, I want an Office to earn Urbs from the Jobs its Riders fill, so that connecting it by public transport pays.
3. As a player, I want the Citizens who walk to work to take the Jobs near their Home first, so that building workplaces beside Homes keeps paying.
4. As a player, I want Citizens on bicycles to come right after walkers, so that the Pedestrian paths are rewarded beyond walking range.
5. As a player, I want Citizens to pick public transport or the car by Travel time, so that a fast Metro line attracts Riders and a slow one does not.
6. As a player, I want a jammed road to push Citizens towards public transport, so that Bus lines and Metros are rewarded where traffic is worst.
7. As a player, I want a line with no spare capacity to leave Citizens on the road, so that a small line cannot absorb a district.
8. As a player, I want to see how many Citizens are Unemployed, so that I know when I need more workplaces.
9. As a player, I want Unemployed to have no effect on my Tax, Well-being or Sanction, so that this change does not punish me.
10. As a player, I want to see which workplaces have unfilled Jobs, so that I can understand why a building has no employees.
11. As a player, I want the result to be the same on every reload and in catch-up, whatever the order of my buildings.
12. As a player, I want my existing city to load with an Adaptation period, so that its change of Rider share does not cost me Well-being straight away.
13. As a player, I want the Guide and the Codex to explain how Jobs are filled, so that the rule is not a mystery.

## Implementation Decisions

- Tickets are in [issues/](issues/); they are ordered so that each one leaves the game working.
- The model stays aggregate per Home, pure and injected-clock, as in ADR 0011.
- Travel times by car use the speed of each Road section; the speed per Road tier is data, not code (ADR 0021). Two passes (free-flow, then with the speeds of the first), never an iteration to a fixed point.
- The 70% Rider eligibility (`TRANSIT_ELIGIBLE_SHARE`) and the Modal shift (`SHIFT`, `modalShift.ts`) are removed; the share of Riders is limited by the spare capacity of lines.
- Riders keep making their Service trips by public transport.
- Tie-breaking is by Home id then workplace id so a result never depends on iteration order.

## Out of Scope

- Any effect of Unemployed on Tax, Well-being, Needs or Sanction.
- Individual Citizen journeys.
- Workplaces that need qualified workers (Knowledge) or a minimum number of Jobs filled to operate.

## Open points

- Order of the three passes inside a Citizen group of the same Home when jobs run out is by Travel time; confirm in play that it does not starve small workplaces next to large ones.
- Performance budget of Transit itineraries towards every workplace is to be measured in ticket 03.
