# Waste Causes

Status: resolved
Spec: ../spec.md
Blocked by: congestion-diagnosis 01

## What to build

`diagnoseWaste(state)` in `src/core/waste/diagnosis.ts`, implementing the Causes of the spec on top of `wasteSituation`. Thresholds in the `WASTE_DIAGNOSIS` constant.

## Acceptance criteria

- [ ] One function per Cause, pure, tested on small hand-built cities in the style of `wasteSituation.test.ts`: it fires on the case it names and stays silent otherwise.
- [ ] Empty Diagnosis below the Citizens threshold, during Adaptation, and when everything is covered.
- [ ] Weights are Citizen-weighted, so one big uncovered Home outranks several small ones.
- [ ] `facilitiesStopped` distinguishes no Urbs, no road link and power shortage, and names the dominant one.
- [ ] A Mound-only city that lacks capacity yields `capacityShort` and, when the Mounds smell on Homes, `nuisance` too.
- [ ] Result independent of the order of `state.buildings`.
