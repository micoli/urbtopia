# Land Value Layer

Status: resolved
Spec: ../spec.md
Blocked by: 03, 04

## What to build

`landValueField(state)` in the core: desirability of each tile, higher near Green spaces, Public facilities, Leisure buildings and Road or public transport access, lower near Pollution, Odor and Congestion. Display only; tunable constants in `.scratch/analytics-view/balancing.md`.

## Acceptance criteria

- [ ] Pure, deterministic, order independent, tested on small cities.
- [ ] No other system reads it: Parcel prices, Tax and Well-being unchanged.
- [ ] Constants named and documented in balancing.md.
