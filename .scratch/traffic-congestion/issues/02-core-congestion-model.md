# Core Congestion model

Status: ready-for-agent
Blocked by: none

## What to build

A pure core module (no `three`, injected clock) that adds Road tiers and computes Congestion from Commutes.

## Acceptance criteria

- [ ] Road tile has a Road tier (1, 2, 3 Lanes per direction) with upgrade action and Urbs cost
- [ ] Commuters per Home = Citizens − Riders (floored at 0)
- [ ] Commuters spread over all workplaces (Workshop, Factory, Shop, Public facility, Leisure building) and loaded on the shortest road path; the design leaves room for per-workplace job limits ([01](01-limited-jobs.md))
- [ ] Per-section load ÷ capacity, per-Commute bottleneck, per-Home congestion ratio, city index weighted by Citizens
- [ ] Disconnected sections detected (Homes without workplace, or workplaces without Home) and flagged; their Homes get maximum Congestion
- [ ] Crossings, roundabouts and independent networks (BRT, Railway) respect existing road graph rules
- [ ] Vitest coverage with injected inputs, including a bottleneck, a disconnected section and a Home with no road

## Comments
