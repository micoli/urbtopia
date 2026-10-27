# Window schedule

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

Pure function giving whether a window is lit, from its place, the number of the Day cycle and the cycle time: about 60% used, on between 22:00 and 00:30, off between 00:30 and 05:30. Wired into the shader as per-window draw.

## Acceptance criteria

- [x] Deterministic: same place and night give the same answer; another night gives another pattern.
- [x] About 60% of windows are used, none lit in Daytime, a peak of lit windows early in the Night and none at dawn.
- [x] Unit tests of the schedule; no `Math.random()`, nothing saved.

## Findings

- The draw runs on the GPU with an integer hash (PCG) mirrored in `src/scene/windowSchedule.ts`, which holds the constants and the unit tests. A sin-based hash was rejected: its result differs between GPUs.
- A window is the cell of its world position (0.5 wide, 0.3 high). Checked by eye on one apartment building: panes are lit whole, none cut in two. Not checked on other building types.
- Windows follow the Day cycle already: Always day lights none, `?time=` drives them (wired in `GameScene.refreshLighting`). Power is ticket 03.
