# Transit evolutions: loop lines, Transit hub, cycling, Transport map

## Problem

Lines can only run from a first stop to a last stop, there is no station where Road, BRT and Railway meet, bicycles do not exist, and nothing shows the transport network as a whole.

## Decisions

Vocabulary and rationale: `CONTEXT.md` (Loop line, Transit hub, Cyclist Rider, Cycling trip, Transport map, Access mode) and ADR 0038.

### Loop lines
- Optional `loop?: boolean` on `BusLine` (so on `TransitLine`) for every mode. Absent means not looped. No save migration; `validate.ts` accepts the field.
- At least 3 stops. The closing section last stop to first stop is resolved like any other section and must be connected, otherwise the line is `disconnected`.
- One direction only: vehicles circulate A→B→C→A. Transit itineraries follow the direction, with no way back to the previous stop other than going around.
- `LineEditor` gets a "Loop" checkbox, refused with a reason under 3 stops. The closing section is drawn like the others.

### Transit hub
- New building, footprint 3x2, cost 1500 Urbs, unlocked at 1000 Citizens, section `build.transport`. Balancing is tunable (ADR 0023).
- `rail` becomes an Access mode next to `road` and `brt` (ADR 0017).
- Valid as soon as it touches one of the four networks: Road, BRT corridor, Railway, Pedestrian way or Sidewalk. Without a vehicle network it is inactive and covers no Home.
- One stop per mode touched. A line uses it as a stop of its own mode, once per line. Front tile on each network is the tile adjacent to its footprint.
- A Transfer between two lines that share a hub needs no walking distance (no 2-tile rule) and still counts towards the 2-Transfer maximum.

### Cycling
- Cycling trip: aggregate per Home over the Pedestrian path network, thresholds x3 the Walking trip's (shop 36, school/health/culture/casino/townHall 45, park 60, work threshold x3), same `tripsPerCitizen`. It replaces the Walking trip beyond walking range, never adds to it. Loads Crossings like pedestrians, counts for Well-being and `walkAccess`. A workplace within cycling range creates no car demand, with no Congestion condition.
- Mode split has four values: car, transit, walking, cycling, in city stats and Commute detail.
- Cyclist Rider: BRT stations, Railway stations and Transit hubs cover Homes and activities up to 3 x `stopRadius` (18 tiles); bus stops keep 6. A cyclist takes 2 places per line used (a pedestrian 1). Their Transit itinerary has no bus leg.

### Transport map
- New section `eco-transportMap` in City management after Transport, with its `SectionNavigation` entry. Read-only, computed on open from `transportStats`, nothing saved.
- SVG schematic: nodes at real coordinates, lines as coloured strokes through their stops in order, pan and zoom, fit to content by default.
- Filter chips per mode (Bus, BRT, Rail). Transfers drawn dashed. Car, walking and cycling flows are not drawn; `ModeMix` sits next to the map.
- Volume per line only: thickness follows load (Riders / capacity), colour follows level (free, loaded, saturated). Tooltip: Riders split into pedestrians and cyclists, capacity, Headway, status.
- Style by mode (bus thin, BRT thick, rail with ties). Disconnected, unfunded, no-vehicle or no-energy lines are grey and dashed. Loop lines are closed with direction arrows. Hubs are large nodes. BRT, Railway and hub stops carry a bicycle icon.
- Click a line or stop to highlight it and show its card; the others fade.

## Out of scope
- Volume per segment between stops, bicycle parking or sharing, bikes on ordinary buses, drawing car/walking/cycling flows on the map.

## Issues
01 Loop lines core, 02 Loop line editor, 03 Rail access mode and Transit hub, 04 Hub as stop and free Transfers, 05 Cycling trip, 06 Cyclist Rider, 07 Transport map.
