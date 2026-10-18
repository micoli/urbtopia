# 07: Waste section in the City management page

**What to build:** The City management page gets a Waste section that details the city's waste situation, next to the Energy, Emissions and Nature sections. It summarises the live state and links to the Codex page for the full calculations.

**Blocked by:** 01, 02

**Status:** done

- [x] Waste section in `src/ui/stats/management/`, listed in the section navigation and as an overview tile like the other sections.
- [x] Balance of the day: Waste produced against total processing capacity, with the share left unprocessed.
- [x] Per facility family (Recycling plant, Incinerator, Mound): number of buildings, capacity, Waste processed, usage cost per day, and which are stopped (no Urbs, power shortage).
- [x] Coverage: Homes covered and uncovered, grouped by cause (out of reach, capacity full, no road link, beyond the Carrying distance), and the Citizens concerned.
- [x] Impacts: Homes under an Odor radius or an Incinerator malus, and the Climate emissions of the Incinerators, linked to the Emissions section.
- [x] Pedestrian districts: Homes served through a Pedestrian path network and the surcharge they cost.
- [x] A bottleneck shortcut like `BottleneckButton` that centres the map on the most pressing problem (uncovered Homes or a stopped facility).
- [x] Link to the Codex Waste page (issue 04); numbers come from the same core functions as the simulation.
- [x] FR/EN strings, one React component per file, stories and a test like `NatureSection`.

Progress notes:
- Per facility family: figures, nominal and reduced capacity, and the stops for no Urbs, no road link and power shortage come from `wasteReport`, which scales a Recycling plant's capacity with the power ratio it receives (none during the Adaptation period).
- Codex link: `WasteCodexLink` opens `openCodex(undefined, 'waste')`.
