# Balancing

Status: ready-for-agent
Blocked by: 02, 03, 04

## What to build

Set thresholds, weights, `k`, cap, Well-being benefit and pedestrian count from headless autoplayer measurements, and document them.

## Acceptance criteria

- [ ] Values documented in `.scratch/pedestrian-network/balancing.md`, next to the congestion values
- [ ] Measured: walking share, car load, Congestion index, Modal shift frequency, before and after
- [ ] Placing Crossings has a visible trade-off: capacity lost against cars avoided
- [ ] Existing cities load without a Congestion spike, or the Adaptation period covers it
- [ ] Values in `GAME_CONFIG` match the document

## Comments
