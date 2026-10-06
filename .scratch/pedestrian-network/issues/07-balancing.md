# Balancing

Status: resolved
Blocked by: 02, 03, 04

## What to build

Set thresholds, weights, `k`, cap, Well-being benefit and pedestrian count from headless autoplayer measurements, and document them.

## Acceptance criteria

- [x] Values documented in `.scratch/pedestrian-network/balancing.md`, next to the congestion values
- [x] Measured: walking share, car load, Congestion index, before and after (Modal shift frequency not measured: the autoplayer builds no Bus line)
- [x] Placing Crossings has a visible trade-off: capacity lost against cars avoided
- [x] Existing cities load without a Congestion spike, or the Adaptation period covers it
- [x] Values in `WALKING` (`src/core/traffic/walking.ts`) match the document

## Comments

## Answer

`.scratch/pedestrian-network/balancing.md` documents the values in `WALKING` and two measurements: the autoplayer city (walking changes nothing but a +1 to +1.6 Well-being gain, no Adaptation period needed) and a hand-built street (a Crossing reaches its 60% cap with one medium Home). Values kept as is; first thing to lower if playtests find Crossings too punishing is `crossingCutPerPedestrian`.
