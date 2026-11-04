# Metro lines, vehicles, Transfers and Transit reach

Status: resolved
Spec: ../spec.md
Blocked by: 04

## What to build

Metro lines run purchased vehicles between Metro stations and take part in the Transit itinerary.

## Acceptance criteria

- [x] Metro lines (open or Loop line) with a Headway; vehicles bought into the Transit fleet, one line at a time.
- [x] Never slowed by Congestion; Cyclist Riders and Transfers follow the existing transit rules (ADR 0007, 0038).
- [x] Metro stations extend Transit reach (ADR 0042); a removed station leaves its lines.
- [x] Metro vehicles drawn on Level -2 only.
