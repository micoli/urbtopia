# Tickets and Takings for Attractions

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Each Attraction has a Ticket (3 levels). Tourist entries turn into Takings, capped by Tier and collected by hand, reusing the Venue Takings mechanism. A higher Ticket earns more per entry and draws fewer Tourists.

## Acceptance criteria

- [ ] Ticket level saved with the building; default is the middle level.
- [ ] Takings accrue per hour, are capped, and are collected by a Command through the Command gateway.
- [ ] Tests: Ticket trade-off, cap, collection, catch-up replay.
