# Public facilities: balancing notes

Initial values come from `spec.md` and live in `src/core/facilities.ts`. Adjustments made during implementation:

- **Capacity is a soft cap.** A facility serves Homes nearest first while its used capacity is below its Citizen capacity; the Home that crosses the limit is still covered. With a strict cap, a School (200) could never cover a Tier 7 Home (250 Citizens), which would make Tiers 7 and 8 unreachable.
- **Facilities need a road in front** like Homes, so Service vehicles can leave by road. Coverage itself stays road-free.
- **Demand:** every facility has 2 electricity Demand (a Tier 2 Home); only the Hospital has 2 water Demand.
- **Service bonus:** `Well-being = 100 − (100 − green) × 0.9^n`, where `n` counts covered Service categories, with each distinct Culture facility type counting separately. First category: +10 from zero, then diminishing returns under 100.
- **Missing services:** −10 each, capped at −40, suspended during the Adaptation period. Tax multiplier is `1 + Well-being / 500`.
- **Version 7 saves** get `adaptationUntil = max(existing, lastSeen + 24 h)`.
- **Autoplayer** builds the missing facility on demand near the blocked Home (roads at y = 64 and y = 74 for service sites).
