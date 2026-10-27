# Window schedule

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Pure function giving whether a window is lit, from its place, the number of the Day cycle and the cycle time: about 60% used, on between 22:00 and 00:30, off between 00:30 and 05:30. Wired into the shader as per-window draw.

## Acceptance criteria

- [ ] Deterministic: same place and night give the same answer; another night gives another pattern.
- [ ] About 60% of windows are used, none lit in Daytime, a peak of lit windows early in the Night and none at dawn.
- [ ] Unit tests of the schedule; no `Math.random()`, nothing saved.
