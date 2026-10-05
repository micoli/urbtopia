# Dynamic modal shift

Status: resolved
Spec: [traffic-congestion-followups](../../traffic-congestion-followups/spec.md)

Deferred from the traffic congestion grilling (2026-10-05, Q7).

## Question

Should more Congestion push more Citizens to public transport where a line exists, so the car / public transport mix reacts to it? Today Riders come only from Bus stop and line coverage.

## Notes

- Must stay deterministic and bounded; no individual journeys (ADR 0005).

## Answer

Implemented per the follow-up spec (modal shift part): `src/core/traffic/modalShift.ts` (`SHIFT`, one pass over Homes in id order using `transportStats().homeLines` and line spare capacity), `congestionStats` recomputes once with the shifted Riders (`shift` field), `cityTransportStats` adds the shifted Riders to riders, line riders and emissions (used by City Management and the climate). Traffic section shows the Riders won. Glossary: **Modal shift**. Values in `balancing.md`.

- Design point found while implementing: the usual 70% Rider cap is already reached whenever a line has spare capacity, so the shift needed its own ceiling (90% of a Home's Citizens), otherwise it could never act.
- `transportStats` stays the coverage baseline (used by the energy and cost accounting); only the panel and the climate read the merged figures.
- ADR 0011 still holds: no individual journeys, aggregate core model.
