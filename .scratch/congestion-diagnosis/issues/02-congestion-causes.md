# Congestion Causes

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

`diagnoseCongestion(state, congestion, transport)` in `src/core/traffic/diagnosis.ts`, implementing the Causes of the spec on top of `congestionStats`. Thresholds in the `CONGESTION_DIAGNOSIS` constant.

## Acceptance criteria

- [ ] One function per Cause, each pure and tested on a small hand-built city in the style of `congestion.test.ts`: it fires on the case it names, and stays silent on a city that does not have it.
- [ ] `corridor` groups contiguous saturated sections of near-equal load into one run and names its two ends.
- [ ] `homesFarFromJobs` uses Citizen-weighted and Job-weighted barycentres, and stays silent on a city with few Homes.
- [ ] An uncongested city returns an empty Diagnosis.
- [ ] The result does not depend on the order of `state.buildings` or `state.roads`.
- [ ] Crafted figures check `corridor`, `crossingsChoke`, `homesFarFromJobs` and `disconnected`; a hand-built jam checks `untouchedTiers` and `noTransit`/`carHeavy`. Checked by hand on a real 600-Home save: `carHeavy`, `untouchedTiers` and `corridor` come out on top.
- [ ] Cost: no second call to the Commute calculation.
