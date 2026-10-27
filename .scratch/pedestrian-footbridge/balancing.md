# Footbridge balancing

Starting values of the [spec](spec.md), set by the author. They are not measured: no headless autoplayer run has compared Footbridges with Crossings yet.

| Value | Where | Starting value |
| --- | --- | --- |
| Price, span 1 / 2 / 3 / 5 (corridors and stairs included) | `BRIDGES.footCosts` | 180 / 270 / 360 / 570 Urbs, the Road Bridge price times 0.6 |
| Unlock | `BRIDGES.unlockCitizens` | 120 Citizens, as the other Bridges |
| Refund | `GAME_CONFIG.sellRefundRatio` | as every Bridge |
| Walk cost, corridor to corridor | one step per tile of the route | span + 3 |
| Crossing, for comparison | `WALK.crossingExtraCost` | 1 + 2 = 3 |
| Stair height | `BRIDGE_CLEARANCE` | 0.5, landing at 0.25 (rendering only) |

A Footbridge over one Road walks as 1 (sidewalk to corridor) + 4 + 1 between the two sidewalks, against 3 for a Crossing, so pedestrians take it only where the Crossing is removed.

## To measure

- Congestion index and saturated Crossing count of a city with busy Crossings, before and after replacing them with Footbridges.
- Share of Walking trips that survive the detour at the thresholds of `WALKING.thresholds`.
- If players keep Crossings by habit, narrow the gap: lower the corridor-stair steps or raise `crossingExtraCost`.
