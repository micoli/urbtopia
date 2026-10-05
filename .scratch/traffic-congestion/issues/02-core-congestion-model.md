# Core Congestion model

Status: resolved
Blocked by: none

## What to build

A pure core module (no `three`, injected clock) that adds Road tiers and computes Congestion from Commutes.

## Acceptance criteria

- [x] Road tile has a Road tier (1, 2, 3 Lanes per direction) with upgrade action and Urbs cost
- [x] Commuters per Home = Citizens − Riders (floored at 0)
- [x] Commuters spread over all workplaces (Workshop, Factory, Shop, Public facility, Leisure building) and loaded on the shortest road path; the design leaves room for per-workplace job limits ([01](01-limited-jobs.md))
- [x] Per-section load ÷ capacity, per-Commute bottleneck, per-Home congestion ratio, city index weighted by Citizens
- [x] Disconnected sections detected (Homes without workplace, or workplaces without Home) and flagged; their Homes get maximum Congestion
- [x] Crossings, roundabouts and independent networks (BRT, Railway) respect existing road graph rules
- [x] Vitest coverage with injected inputs, including a bottleneck, a disconnected section and a Home with no road

## Comments

## Answer

Implemented in `src/core/traffic/` (`roadTier.ts`, `congestion.ts`, `congestion.test.ts`), command `UpgradeRoads`, per-Home Riders in `transportStats().homeRiders`, road graph moved to `src/core/map/roadGraph.ts` (scene re-exports it).

- Capacity is per tile and ignores direction; ratio per Home is clamped at `CONGESTION.maxRatio` (2), also used for disconnected Homes.
- Balancing alert for ticket 06: with 6 / 14 / 24 Commuters per tile, a single tier-4 Home (60 Citizens) already gives a ratio above 2. Capacities must be scaled up by roughly an order of magnitude before ticket 03 wires the penalty.
