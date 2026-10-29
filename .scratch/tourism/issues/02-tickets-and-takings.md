# Tickets and Takings for Attractions

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

Each Attraction has a Ticket (3 levels). Tourist entries turn into Takings, capped by Tier and collected by hand, reusing the Venue Takings mechanism. A higher Ticket earns more per entry and draws fewer Tourists.

## Acceptance criteria

- [x] Ticket level saved with the building; default is the middle level.
- [x] Takings accrue per hour, are capped, and are collected by a Command through the Command gateway.
- [x] Tests: Ticket trade-off, cap, collection, catch-up replay.
