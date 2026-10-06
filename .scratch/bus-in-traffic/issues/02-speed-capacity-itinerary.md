# Capacity and itinerary from effective speed

Status: ready-for-agent
Blocked by: 01

## What to build

Bus capacity and itinerary times use the effective speed; Modal shift uses the effective capacity (one pass, no loop).

## Acceptance criteria

- [ ] Effective capacity = capacity × effective ÷ nominal speed
- [ ] Itinerary time for bus lines uses the effective speed; BRT and rail unchanged
- [ ] Pass 1 speeds feed transport statistics and Modal shift, then congestion is recomputed once
- [ ] Rider totals stay consistent with the transport statistics
- [ ] Unit tests: slower line carries fewer Riders, loses an itinerary choice, Modal shift bounded, determinism

## Comments
