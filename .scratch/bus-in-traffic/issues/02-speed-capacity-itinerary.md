# Capacity and itinerary from effective speed

Status: resolved
Blocked by: 01

## What to build

Bus capacity and itinerary times use the effective speed; Modal shift uses the effective capacity (one pass, no loop).

## Acceptance criteria

- [x] Effective capacity = capacity × effective ÷ nominal speed
- [x] Itinerary time for bus lines uses the effective speed; BRT and rail unchanged
- [x] Pass 1 speeds feed transport statistics and Modal shift, then congestion is recomputed once
- [x] Rider totals stay consistent with the transport statistics
- [x] Unit tests: slower line carries fewer Riders, loses an itinerary choice, Modal shift bounded, determinism

## Comments

## Answer

`transitServices` and `transportStats` take optional `speedFactors` (line id to factor, only for lines below 1). A bus line then has `speed = nominalSpeed * speedFactor` and `capacity = lineCapacity * speedFactor`; BRT and rail ignore the factors. `congestionStats` runs pass 1 (loads, speeds), builds the transport statistics with the slowed lines, computes Modal shift on them and recomputes the loads once; the exposed speeds stay those of pass 1. `cityTransportStats` uses the same factors. Existing modal shift tests now use 8 lines: five lines on a tier 1 street load it and slow themselves enough to leave no spare capacity. Tests in `busSpeedEffects.test.ts`.
