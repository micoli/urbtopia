# Metro lines, vehicles, Transfers and Transit reach

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 04

## What to build

Metro lines run purchased vehicles between Metro stations and take part in the Transit itinerary.

## Acceptance criteria

- [ ] Metro lines (open or Loop line) with a Headway; vehicles bought into the Transit fleet, one line at a time.
- [ ] Never slowed by Congestion; Cyclist Riders and Transfers follow the existing transit rules (ADR 0007, 0038).
- [ ] Metro stations extend Transit reach (ADR 0042); a removed station leaves its lines.
- [ ] Metro vehicles drawn on Level -2 only.
