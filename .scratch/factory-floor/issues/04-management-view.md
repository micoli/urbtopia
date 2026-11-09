# Management view of a Factory

Status: resolved
Blocked by: 02

## Answer

- The Factory panel gets an "Open the Factory floor" button (`src/ui/factory/FloorButton.tsx`) that opens the same Venue view (`venueStore.open`).
- `VenueScene` and `VenueCanvas` accept `'factory'`: the canvas edits the Fixtures of a Venue or of a floor through one `Interior` adapter, with the floor commands and the floor ghost rule (`canStandOnFloor`). No crowd, no hints from a Venue's layout.
- The shell (floor, half-height walls, corner post) comes from `floorShell` in `assets/defs/buildings/factory.json`, like a Venue's `shell`; the three `.reserved` markers are gone.
- `FloorMenus`: a dock with Build and Back, a header with the Urbs, the Machines linked and the speed and yield bonus (`FloorStats`), the build menu by category (Power, Plumbing, Machines, Walls) and the side panel of the selected Fixture (move, turn, sell; no Repair yet, issue 05).
- Checked in the browser: opening the floor, placing a Motor, a Shaft and a Press, turning the Press until it shows "1 / 1" and "+20 %" speed.
- Not done: the Takings, Staff and events sections are simply absent; no Playwright test yet.
