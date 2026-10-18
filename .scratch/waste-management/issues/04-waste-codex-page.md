# 04: Dynamic Waste page in the Codex

**What to build:** A Codex page that shows every Waste calculation with live values, in the style of `SanctionsPage` and `EnergyProductionPage`.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Production: Citizens × rate = daily Waste, with the Homes that are not covered.
- [ ] Allocation: Recycling plant, Incinerator, Mound in order, each with number of buildings, total capacity, Waste processed, usage cost and whether it is stopped (no Urbs, power shortage).
- [ ] Coverage: covered and uncovered Homes with the cause of each.
- [ ] Pedestrian zones: Carrying distance, surcharge, number of Homes concerned.
- [ ] Nuisances: Incinerator malus and Climate emissions, Odor radius, Homes affected (worst Mound, no summing).
- [ ] Sanction by Difficulty for the Waste factor and the Adaptation period state.
- [ ] Total cost per day and the share due to the surcharge.
- [ ] All numbers come from the same core functions as the simulation, never recomputed in the UI.
- [ ] Entry added to `useCodexManifest`, linked from the Mound, Incinerator and Recycling plant panels through `CodexLinks`; FR/EN strings, one component per file, stories and a test.
