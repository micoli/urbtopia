# Limited jobs at workplaces

Status: resolved
Spec: [traffic-congestion-followups](../../traffic-congestion-followups/spec.md)

Deferred from the traffic congestion grilling (2026-10-05, Q3 option b).

## Question

Congestion first spreads each Home's car Commuters over all workplaces with no limit. Should workplaces have a limited job capacity (via Slots or Tier), so that they fill up and Commuters overflow to the next workplace?

## Notes

- Out of scope of the first congestion delivery; the Commute model must not prevent adding a per-workplace capacity later.
- Needs a decision on what counts as a job count per building type (Workshop, Factory, Shop, Public facility, Leisure building).

## Answer

Implemented per the follow-up spec (jobs part): `src/core/traffic/jobs.ts` (`JOBS`, `jobsOf`), nearest-first filling in `congestionStats` (new `jobs`, `unemployed` totals and per-Home `unemployed`), `commuters` now counts only Commuters who drive. Traffic section shows Jobs and Commuters without a job. Glossary: new **Job**, **Commute** updated. Values and measurements in `balancing.md`.

- No new save version: nothing persisted changed. Adaptation for cities saved before job limits is not added, since version 11 and job limits ship together.
- A disconnected Home's Commuters still count as wanting to drive; they do not take Jobs.
