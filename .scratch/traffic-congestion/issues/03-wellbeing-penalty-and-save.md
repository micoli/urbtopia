# Well-being penalty and save

Status: ready-for-agent
Blocked by: 02

## What to build

Apply Congestion to Home Well-being and persist Road tiers.

## Acceptance criteria

- [ ] Per-Home penalty: none up to 100% load, then linear, capped (constant in balancing)
- [ ] Disconnected Homes take the maximum penalty
- [ ] Adaptation period for already-saved cities; none for newly built Roads
- [ ] Penalty exposed separately in `homeBenefits` / `cityBenefits` beside `pollutionPenalty`, and still modulates Tax
- [ ] Road tier persisted with a save version migration; older saves load with tier 1 and an Adaptation period
- [ ] Live ticks and catch-up agree (ADR 0002)
- [ ] Vitest coverage including migration

## Comments
