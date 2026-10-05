# City Management traffic panel

Status: resolved
Blocked by: 02, 03

## What to build

Show Traffic impacts and the car / public transport mix in City Management.

## Acceptance criteria

- [x] Congestion tile in `CityOverview`: city index in %, alert above 100%
- [x] Link to the transit tab, like the Riders tile
- [x] Traffic section: Commuters by car vs Riders as a mix in %, saturated section count, disconnected section count
- [x] `WellbeingSection` shows a congestion line beside the coal penalty
- [x] FR/EN strings, one React component per file
- [x] Component tests in `CityManagement.test.tsx` style

## Comments

## Answer

- Overview: Congestion tile (button, alert above 100%) scrolling to the new Traffic section; navigation entry added.
- `TrafficSection`: car / public transport mix in %, Commuters by car vs Riders, congestion index, saturated tile and disconnected section counts, help text, link to the transit section. `WellbeingSection` shows the congestion penalty beside the coal one. FR/EN strings.
- Added with this ticket (agreed with the user): Road tier upgrade UI. New path tool `upgradeRoad` ("Add a lane" in the Roads menu, start then end tile, cost previewed). `UpgradeRoads` now skips tiles already at the maximum tier and fails only when none can be upgraded. `isPathTool` / `PathTool` in `src/tools/tools.ts` replace the road / demolish checks in `ConfirmPad`, `uiStore` and `confirmTool`.
- Checked by eye in the dev server (overview tile, navigation, Traffic section in French).
