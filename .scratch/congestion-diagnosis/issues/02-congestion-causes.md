# Congestion Causes

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

`diagnoseCongestion(state, congestion, transport)` in `src/core/traffic/diagnosis.ts`, implementing the Causes of the spec on top of `congestionStats`. Thresholds in `assets/defs/balance/` with a schema, as for the other balance files.

## Acceptance criteria

- [ ] One function per Cause, each pure and tested on a small hand-built city in the style of `congestion.test.ts`: it fires on the case it names, and stays silent on a city that does not have it.
- [ ] `corridor` groups contiguous saturated sections of near-equal load into one run and names its two ends.
- [ ] `homesFarFromJobs` uses Citizen-weighted and Job-weighted barycentres, and stays silent on a city with few Homes.
- [ ] `emptyJobsFarAway` ignores BRT-only workplaces (they are staffed by Riders).
- [ ] An uncongested city returns an empty Diagnosis.
- [ ] The result does not depend on the order of `state.buildings` or `state.roads`.
- [ ] A fixture built from a real save (trimmed) checks that a city with all Roads at Tier 1, Homes far from Jobs and a saturated artery yields `untouchedTiers`, `corridor` and `homesFarFromJobs`, in that order of weight.
- [ ] Cost: no second call to the Commute calculation; measured on a 1000-Home city it adds a negligible share to `congestionStats`.
