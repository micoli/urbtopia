# 01: Arcade end to end (tracer bullet)

**What to build:** The player can place an Arcade, open its Management view from the side panel, place one game machine on the interior grid and collect Takings from the Visitors it attracts. It is the thinnest slice through every layer: asset pack, `buildings.json` entry, save, pure core, interior scene, panel. See ADR 0020.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The Kenney packs Mini Arcade, Mini Market and Furniture Kit (already in `assets/kenney/`) are registered in the asset pipeline; the models the Arcade uses are extracted and have Model definitions (footprint, scale, source, CC0 license).
- [ ] An Arcade entry exists in `assets/buildings.json` (Leisure-style section in the build menu, Road and BRT access, Unlock threshold in Citizens); the generated building types are refreshed.
- [ ] The side panel of a placed Arcade has a button that opens the Management view; a close button returns to the city exactly as left (camera, selection).
- [ ] The Management view is its own three.js scene with a 6x6 grid and a Build menu offering one Fixture (an arcade machine); it can be placed on a free cell and shown on the grid.
- [ ] The pure core computes Takings for one tick as `Visitors x service rate x price` with Visitors drawn from the Homes around; Takings accumulate per Venue and are collected by hand, capped like Tax.
- [ ] A Venue is saved as a list (Fixtures, Takings); older saves load with no Venue; version bumped with a migration test.
- [ ] A Venue is simulated by the injected clock and replayed by Catch-up; tested headless.
- [ ] Pure core tested without three.js; scene code kept apart from rules.
- [ ] FR/EN strings; one Codex entry.
