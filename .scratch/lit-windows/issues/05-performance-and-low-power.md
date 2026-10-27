# Performance and low-power cutoff

Status: resolved
Spec: ../spec.md
Blocked by: 04

## What to build

Measure the frame time on the dense reference city before and after (ADR 0034), and switch the feature off on `low-power` devices. Write ADR 0050.

## Acceptance criteria

- [ ] Median frame time within +5% on the reference phone. Not shown: on the desktop GPU of the dev machine (348 buildings, 180 draw calls, 1.09M triangles) a frame takes about 6.2 ms with windows and 6.6 ms without, within the noise. Still needs a performance trace on a phone.
- [x] Off automatically on a slow device: ADR 0034's `low-power` detection did not exist beyond the GL context hint, so `FrameBudgetMonitor` (renderBudget.ts) turns the windows off for the session when the median frame interval stays above 45 ms.
- [x] ADR 0050 written, extending ADR 0034.
