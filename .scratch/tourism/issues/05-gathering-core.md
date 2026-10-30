# Gathering core and Shows

Status: resolved
Spec: ../spec.md
Blocked by: 02

## What to build

Pure model of a Gathering: cost, cooldown per Attraction, crowd = capacity x fill, surplus split between Tourists and Citizens in reach. Show programming Command for Theater, Concert hall and Colosseum.

## Acceptance criteria

- [x] Fill depends on quality, Ticket and mean Well-being; tested.
- [x] Cooldown refuses a second Gathering; cost debited through the Command gateway.
- [x] A Gathering in progress survives a save and a catch-up.
