# Camera jump to the worst bottleneck

Status: resolved
Spec: [traffic-congestion-followups](../../traffic-congestion-followups/spec.md)
Blocked by: 05

Deferred from the traffic congestion grilling (2026-10-05, Q9).

## What to build

A button in the Traffic section that centres the camera on the worst bottleneck.

## Answer

- `congestionStats().worstBottleneck`: saturated section (ratio > 1) with the highest ratio, ties by highest load then smallest (y, x); `null` otherwise (`worstSection` in `src/core/traffic/congestion.ts`).
- `uiStore.showTile(tile)` closes City Management and calls `sceneHandle.current?.focusOnTile`.
- `BottleneckButton` shown in the Traffic section only when a bottleneck exists; FR/EN label `eco.showBottleneck`.
- Checked by eye in the dev server on a saturated city: the button closes the panel and the camera lands on the saturated road. The absent-on-calm-city case is covered by a render test only.
