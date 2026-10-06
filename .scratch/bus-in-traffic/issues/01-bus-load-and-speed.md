# Bus load and effective speed

Status: resolved
Blocked by: none

## What to build

Each active Bus line loads the roads it uses and gets an effective speed from the Congestion of its route (core, pure).

## Acceptance criteria

- [x] Constant bus load (start 20) on every tile of the route of each active Bus line; none for inactive lines, BRT or rail
- [x] Bus-only tiles create sections and can saturate
- [x] Effective speed = nominal × length ÷ Σ(1 + excess), floor 50%
- [x] Speeds and ratios exposed in the congestion statistics per line
- [x] Layout signature covers the route tiles; deterministic across calls and catch-up
- [x] Unit tests: load, bus-only saturation, speed, floor, inactive lines, BRT and rail unaffected

## Comments

## Answer

`src/core/traffic/busTraffic.ts` (`BUS_TRAFFIC.load` 20, `slowedBelow` 0.9, `busSpeedFactor`). `calculateCongestion` adds the load on every tile of each active Bus line before building sections, then computes per line `busSpeeds` (factor, slowed), `speedFactors` and `slowedLines` from the section ratios (clamped to the maximum ratio, so never below 0.5). The layout signature covers the route tiles of active bus lines. Bus-only tiles become sections. Tests in `busTraffic.test.ts`. Capacity and itineraries are not yet affected (issue 02).
