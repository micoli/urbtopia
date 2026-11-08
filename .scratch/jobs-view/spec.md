# Jobs view

Status: implemented

Follow-up to [job-search-by-travel-time](../job-search-by-travel-time/spec.md) and [ADR 0059](../../docs/adr/0059-every-citizen-looks-for-a-job-and-picks-the-mode-by-travel-time.md). Vocabulary (**Job**, **Unfilled Job**, **Fill rate**, **Unemployed**, **Staff**, **Data layer**) is in `CONTEXT.md`.

## Problem Statement

Jobs are hard to read in the game:

- the Analytics view has no Layer on Jobs;
- City management has no Jobs section: one line in the Traffic section and the list of unfilled workplaces;
- a Venue's panel shows `filled / jobsOf`, where `jobsOf` is the Staff the player hired and `filled` is what the Commute brings, a fractional city-wide figure. The two do not describe the same thing, and the player pays wages for Staff nobody fills.

## Solution

- A **Venue** panel shows hired Staff, filled Staff and the posts of its Tier side by side. A Venue's Jobs stay its hired Staff.
- A Venue's Staff counts for its performance in proportion to its **Fill rate** (front rate, security rate and manager yield).
- A **Jobs** Data layer paints Homes by share of Unemployed Citizens and workplaces by Fill rate.
- A **Jobs** section in City management (sub-tab "city") holds the totals, the split by kind of workplace, the modes, the Venues and the list of Unfilled Jobs, moved from the Traffic section.
- Unemployed lowers Well-being (ADR 0062, ticket 04); it was a pure statistic in ADR 0059.

## User Stories

1. As a player, I want a Venue to show hired, filled and tier posts, so that I understand why its Jobs do not match its Staff.
2. As a player, I want a Venue with Unfilled Jobs to perform less, so that hiring Staff nobody fills is not free of consequence.
3. As a player, I want a Jobs Layer on the map, so that I see where Citizens lack Jobs and where workplaces lack Citizens.
4. As a player, I want a Jobs section in City management, so that I do not look for employment in Traffic.
5. As a player, I want Unemployed Citizens to lower the Well-being of their Home, so that the Jobs my city offers matter (amended by ADR 0062, ticket 04).

## Out of scope

A Sanction or a direct effect of Unemployed on the Tax (the Well-being effect of ticket 04 reaches the Tax only through Well-being).
