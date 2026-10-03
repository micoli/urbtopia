# Urbtopia MVP

Status: ready-for-agent

Source: wayfinder map `.scratch/urbix-mvp/map.md` and resolved tickets 01 to 10. Vocabulary from `CONTEXT.md`. Decisions recorded in ADR 0001, 0002, 0003. All numbers are starting values for a later balancing pass.

## Problem Statement

A player who likes isometric city builders has no lightweight, serverless one they can open in a browser on a phone, tablet or desktop. They want to build roads and buildings, produce Materials, turn them into Goods, sell them for Urbs, and use the Urbs to grow Homes and the city, then close the tab and find their city progressed when they return, with no account and no server.

## Solution

Urbtopia: a solo, serverless, isometric 3D city builder playable in the browser. The player starts with 600 Urbs, a 2x2 block of owned Parcels, a free Workshop and a free Factory. They draw roads, place buildings facing a road, queue production in Slots, collect output by hand into a Storehouse, sell Goods through Shops and the Market, collect Tax from Homes, and spend Urbs and Goods to upgrade Homes through six Tiers. Total Citizens drives Unlocks of new Materials and Goods. Production continues in real time through a saved timestamp and is applied in a single Catch-up pass (up to 48 game hours) on reopen. The city is saved locally and can be exported and imported as JSON. The UI is bilingual FR/EN and touch-first.

## User Stories

### Starting and playing
1. As a new player, I want to start with 600 Urbs, a 2x2 block of owned Parcels, a free Workshop and a free Factory, so that I can begin the core loop immediately.
2. As a player, I want the game to open directly on my city without account or login, so that I can play in seconds.
3. As a player, I want to start a new game after a confirmation that offers me an export first, so that I never lose a city by mistake.
4. As a player, I want each game to have a visible text Seed, so that my game is identifiable and chance-based outcomes are reproducible.
5. As a player, I want the game to work on phone, tablet and desktop browsers, so that I can play on any device.

### Camera and interaction
6. As a touch player, I want to pan the map with one finger, so that I can look around my city.
7. As a touch player, I want to zoom with a pinch, so that I can see detail or overview.
8. As a player, I want to rotate the view in 90 degree snapped steps (two-finger twist, buttons, Q/E), so that I can see behind buildings without disorientation.
9. As a desktop player, I want to pan with WASD or arrows and zoom with the wheel, so that I can play with mouse and keyboard.
10. As a player, I want the maximum zoom-out to be bounded, so that the frame rate stays smooth on my phone.
11. As a player, I want every tap target to be at least 44 px, so that I can use the game with a finger.
12. As a player, I want to tap a building to open its details, so that I can inspect and operate it.
13. As a player, I want floating collect badges above buildings with ready output, so that I see at a glance what to collect and can collect with one tap.

### Land and Parcels
14. As a player, I want the city to live on a fixed 128x128 flat map divided into 16x16 Parcels, so that land is simple and predictable.
15. As a player, I want to buy Parcels adjacent to my owned ones with Urbs, so that I can expand.
16. As a player, I want the Parcel price to grow geometrically (300 x 1.12^n, rounded to ten), so that expansion stays a long-term goal.
17. As a player, I want owned Parcels to be visually distinguished from unowned land, so that I know where I can build.
18. As a player, I want buildings to fit entirely inside owned Parcels, so that rules are clear.

### Roads and placement
19. As a player, I want to drag an L-shaped road with a preview and a total cost, so that I know the price before confirming.
20. As a player, I want road pieces (straight, bend, T, crossroad, end) chosen automatically from neighbours, so that I never pick pieces by hand.
21. As a player, I want separate tools for roundabouts (3x3) and pedestrian crossings, so that I can add them deliberately.
22. As a player, I want Home, Shop, Factory, Workshop, Storehouse to require a front-edge tile touching a road, so that roads matter.
23. As a player, I want Power plants and Water towers to need no road, so that I can place them freely.
24. As a player, I want a building to auto-orient its front toward the adjacent road on placement, with a rotate button to override, so that placement is quick yet controllable.
25. As a player, I want a ghost fixed at the screen centre, that I move by panning, with tap-to-recentre and a check/cross pad, so that I can place precisely with touch.
26. As a player, I want the ghost to be green when valid and red when invalid with a reason, so that I understand refusals.
27. As a player, I want to stay in build mode after confirming a placement, so that I can place several buildings quickly.
28. As a player, I want demolishing a road refused when it is a building's only road, with an explicit message, so that I never orphan a building by accident.
29. As a player, I want to move a building for free (production in progress resets), so that I can reorganise.
30. As a player, I want to sell a building for 75% of its placement cost, so that mistakes are cheap.
31. As a player, I want a confirmation when selling a Home of Tier 3 or higher or a non-empty Storehouse, so that I do not lose value by a misclick.
32. As a player, I want selling a Storehouse refused if remaining capacity would fall below the stock, so that I never lose items.

### Materials, Workshops, Factories
33. As a player, I want Workshops to produce Materials (Wood 1 min, Stone 2 min, Clay 4 min, Metal 8 min, Silicon 16 min), so that I have raw inputs.
34. As a player, I want any Workshop to produce any unlocked Material, so that I am not forced into specialised buildings.
35. As a player, I want Factories to turn Materials into Goods using fixed recipes (Planks, Bricks, Tiles, Tools, Glass, Circuits), so that I build a production chain.
36. As a player, I want any Factory to produce any unlocked recipe, so that I choose freely.
37. As a player, I want each building to have a FIFO queue of Slots (start 2, up to 5), so that I can queue work before leaving.
38. As a player, I want to buy extra Slots with Urbs (500, 1,500, 4,000), so that I can scale a building.
39. As a player, I want finished output to wait on the building until I collect it, so that I stay in control.
40. As a player, I want collection blocked when the Storehouse compartment is full, with finished output staying safe in its Slot, so that nothing is lost.
41. As a player, I want a Slot's remaining time shown, so that I can plan my return.

### Storehouse
42. As a player, I want one Storehouse with two compartments (Materials 20, Goods 40), so that storage is a clear constraint.
43. As a player, I want to upgrade the Storehouse five times (+10 Materials, +20 Goods each, costing 300, 800, 2,000, 5,000, 12,000), so that I can grow my throughput.
44. As a player, I want a clear indication when a compartment is full, so that I understand why I cannot collect.

### Selling Goods
45. As a player, I want Shops with 3 Slots, each taking a stack of 5 units of one Good from the Storehouse, so that I get regular income.
46. As a player, I want citizens to buy 1 unit per 45 s at full base value, so that Shops are slow but profitable.
47. As a player, I want Shop earnings to accumulate (capped at one stack's value per Slot) and be collected by hand, so that collecting is a recurring gesture.
48. As a player, I want a Market panel, unlocked with my first Good, that buys Goods instantly at 60% of base value, so that I can liquidate stock when I need Urbs now.
49. As a player, I want Market prices to drop 5 points per unit sold of the same Good (floor 30%) and recover linearly over 1 hour, so that I cannot exploit it endlessly.
50. As a player, I want Market behaviour to be deterministic (no random fluctuation), so that I can plan.

### Homes, Citizens, Tax
51. As a player, I want to place a Home at Tier 1 for 150 Urbs, so that I start my population.
52. As a player, I want to upgrade a Home one Tier at a time instantly by paying Urbs and Goods, so that growth feels immediate.
53. As a player, I want Tiers 1 to 6 to house 6, 15, 32, 60, 100, 160 Citizens, so that population grows meaningfully.
54. As a player, I want each Home to generate Tax of 1 Urb per Citizen per hour, capped at 8 hours, collected by hand, so that Homes feed my economy.
55. As a player, I want to see upgrade requirements (Urbs and Goods) and what is missing, so that I know what to produce next.

### Power and water
56. As a player, I want Power plants (250 Urbs, Capacity 12) and Water towers (200 Urbs, Capacity 12), so that I can supply my Homes.
57. As a player, I want power and water to be global pools with no network, radius or road, so that the system stays simple.
58. As a player, I want placing or upgrading a Home refused with an explicit message when it would push Demand above Capacity, so that I know to build a plant or tower first.
59. As a player, I want selling a Power plant or Water tower refused when remaining Capacity would fall below Demand, so that the city never enters a shortage state.
60. As a player, I want the HUD to show total Capacity and Demand for power and water, so that I can plan.

### Progression
61. As a player, I want total Citizens to be the only progression metric, so that progress is easy to understand.
62. As a player, I want Clay and Tiles to Unlock at 30 Citizens, Metal and Tools at 80, Silicon, Glass and Circuits at 200, so that new chains appear as my city grows.
63. As a player, I want the HUD to show only the next threshold (for example "18/30 Citizens: Clay, Tiles"), so that I have a clear short-term goal.
64. As a player, I want the game to have no end screen, so that I can keep building as a sandbox.

### Time and Catch-up
65. As a player, I want production to progress in real time, so that the game lives while I am away.
66. As a player, I want everything that happened since my last visit applied in a single Catch-up when I reopen the game, wake the device or return to the tab, so that I find my city progressed.
67. As a player, I want Catch-up capped at 48 game hours with a notification when time was forfeited, so that I understand what happened.
68. As a player, I want Catch-up to respect Storehouse limits, Slot order and Market saturation exactly as live play does, so that offline progress is fair.
69. As a player, I want a backward system clock change to be ignored, so that time cannot run backwards.
70. As a player, I want toasts for events (production completed, storage full, Home upgraded), so that I get feedback without blocking my play.

### Saving
71. As a player, I want my city saved automatically (2 s after a change, every 30 s while dirty, on hidden tab and page hide), so that I never lose progress.
72. As a player, I want my city saved in my browser with no account, so that my data stays on my device.
73. As a player, I want to export my city to a JSON file named with the seed and date, so that I can back it up or move it.
74. As a player, I want to import a JSON file with validation and a confirmation "replace current city?", so that a bad file never corrupts my game.
75. As a player, I want the previous save kept as a backup before an import or migration, so that I can recover.
76. As a player, I want a recovery screen on a corrupted save (restore backup, export raw data, new game with confirmation), so that nothing is deleted silently.
77. As a player, I want a save from a newer app version refused and never overwritten, so that I do not lose data by opening an old build.
78. As a player, I want my save to survive app updates through versioned migrations, so that updates never reset my city.
79. As a player, I want only one tab to be active, with other tabs read-only with a banner and a "resume here" button, so that two tabs never overwrite each other.
80. As a player, I want a quota error to alert me and offer an export, so that I can still keep my city.
81. As a player, I want a discreet export reminder if my last export is older than 14 days and the city progressed, so that I back up occasionally.

### UI, language, preferences
82. As a French or English speaker, I want the whole UI in FR or EN, so that I can play in my language.
83. As a player, I want the game name and currency (Urbtopia, Urbs) identical in both languages, so that the brand stays consistent.
84. As a player, I want a default HUD with a left dock, a flyout for build items and a side panel for selection, so that the interface is efficient.
85. As a player, I want to switch the HUD layout in preferences between the dock layout (default), a bars + bottom sheet layout and a minimal + radial menu layout, so that I can pick what suits my device.
86. As a phone player, I want the HUD to leave enough map visible, so that I can still play on a small screen.
87. As a player, I want 60 fps at normal zoom on a recent phone with a city up to the full map, so that the game feels fluid.

## Implementation Decisions

**Architecture (ADR 0001)**
- TypeScript, Vite, imperative three.js with an orthographic isometric camera. No react-three-fiber.
- React owns only HUD, panels and menus. The scene reads snapshots and never depends on React or simulation internals.
- A thin Zustand store sits between React and the core: commands in, snapshots out.
- World geometry uses instanced meshes per (chunk of 16x16 tiles, model, sub-mesh) with per-chunk bounding spheres for frustum culling. Building or demolishing rebuilds only the affected chunk.
- Maximum zoom-out is bounded by a visible-triangle budget. Distance LOD with Kenney low-detail models stays in reserve; shadows are off until measured.
- The HUD is a swappable layer over the same store and scene API, so the three layouts share all logic.

**Core boundary (ADR 0002)**
- The core is pure TypeScript with no `three`, React, DOM, `Math.random()` or `Date.now()`; a lint rule forbids those imports in the core folder.
- Single entry point `dispatch(command, now) -> { state, events }`, and `advance(now)`. Commands: PlaceBuilding, QueueProduction, Collect, Upgrade, Sell, Demolish (plus road, Parcel purchase, Slot purchase, Storehouse upgrade, Market sale, move). Events (ProductionCompleted, StorageFull, HomeUpgraded, OfflineTimeCapped, ...) feed the UI only and never mutate state.
- Invalid commands return a typed error with a message key, never an exception. State is JSON-serializable.
- Production is stored as absolute timestamps (`startedAt` + `duration`). Live play calls `advance(now)` at 1 Hz; reopen and `visibilitychange` to visible call it once over the whole gap, replayed event by event in chronological order. Gap capped at 48 game hours (a config constant); excess forfeited and `lastSeen` reset.
- Backward clock clamped to `lastSeen`; forward accepted.
- Seeded PRNG (mulberry32 or sfc32 from a hash of an auto-generated text seed such as `amber-fox-4821`). PRNG state is part of the serialized state. The Seed only varies building model choice, not terrain.

**Save (ADR 0003)**
- `SaveStore` interface (get/put/remove) backed by localStorage; IndexedDB reachable later without changing the envelope.
- Envelope `{ format: "urbtopia-save", version, savedAt, state }`; ordered pure migrations vN to vN+1; runtime validation of `state` at the load boundary.
- State holds lists (buildings with id, type, x, y, rotation, tier, slots; compact road runs; `nextId`). Derived data (occupancy grid, power and water totals, spatial index, total Citizens) is rebuilt on load and never saved.
- One save slot plus one backup (key `urbtopia-save-backup`, refreshed every ~10 min and before import or migration). `navigator.storage.persist()` called on first save. Single-active-tab ownership token with `storage` event.
- Import follows the reopen path (migrate, validate, `advance(now)`, cap, clamp).

**Grid and placement**
- 128x128 tiles in 8x8 Parcels; start with the central 2x2 Parcels. Placement validity is a pure core check (footprint inside owned Parcels, free tiles, front-edge road touch for road-dependent buildings).
- Footprints, front direction (-Z at rotation 0) and models come from the asset catalog (`docs/asset-catalog.json`): footprint is `ceil(bbox - 0.15)`, native size, 8 base road pieces. Towers are not Home Tiers. Home Tiers use the suburban models (6 Tiers, 21 models).
- Texture layout `models/<pack>/*.glb` with `Textures/colormap.png` beside them; bake node scales for water tower, detail tank and shipping containers.

**Economy and data**
- All costs, durations, recipes, Tier tables, Parcel costs, Slot costs, Storehouse upgrades and Unlock thresholds are data-driven tables, not hard-coded in rules, so the balancing pass changes data only.
- Power and water demand are two separate data entries sharing the same values.
- Materials are never sold; only Goods have Urbs value. No continuous maintenance cost.

**Unlocks**
- Start open: Wood, Stone, Planks, Bricks and buildings Workshop, Factory, Shop, Storehouse, Power plant, Water tower, Home. Market panel opens with the first Good. Further Unlocks per thresholds above. Parcels gated by cost only.

**UI**
- Layout C default; A and B selectable in preferences. Preferences hold at least language and HUD layout.
- Strings extracted from the start into FR and EN catalogs; all core errors expose message keys, not text.
- Touch caveats to verify on a real phone: 90 degree twist gesture, and layout C on screens under 600 px.

## Testing Decisions

A good test exercises external behaviour through a seam (commands in, state and events out; bytes in, state out), never internal structure. Tests do not assert on private helpers, data table layout or rendering.

**Seam 1: headless core `dispatch` and `advance` with an injected clock.**
- Covers placement rules, roads, selling and moving, production queues, collection and Storehouse limits, Shops, Market saturation and recovery, Tax cap, Home upgrades, utility hard rules, Unlocks, Parcel pricing, Slot purchase, Catch-up and its cap.
- Property tests: `advance(t1)` then `advance(t2)` equals `advance(t2)`; state survives a JSON round trip unchanged; Demand never exceeds Capacity after any valid command sequence.
- Backward clock clamp; same Seed and command sequence gives same state.
- Scenario tests for the pacing check: with starting numbers, a first Home is reachable with exactly the starting 600 Urbs.

**Seam 2: `SaveStore` and envelope load boundary.**
- Round trip save then load; migration chain with frozen fixtures per version; refusal of a newer-than-app save; rejection of malformed or invalid state; backup refresh and restore; import and export through the reopen path; quota error handling via a fake store.
- Every state-shape change requires a version bump and a new fixture.

**Not automatically tested:** the three.js scene and the React HUD. Verified manually on a real phone, a tablet and desktop, including frame rate at normal and maximum zoom and touch gestures. A scene smoke check against core snapshots is optional.

**Prior art:** none in the repo yet (no production code). Prototypes `prototypes/render-bench`, `prototypes/asset-viewer` and `prototypes/touch-ux` are throwaway and are not test prior art.

## Out of Scope

- Multiplayer, trading between players, global market, clubs, leaderboards, events.
- Regions and multi-city.
- Premium currency and in-app purchases.
- Transport beyond roads (buses, rail, ports, airport) and traffic effects.
- Coverage services (fire, police, health), shortage and abandonment mechanics, education, parks, special buildings.
- Guided tutorial and onboarding beyond the HUD next-threshold hint.
- Audio, day and night, visual polish, Home Tier display names.
- PWA install and offline asset caching.
- Per-device-class performance budgets, distance LOD, shadows.
- Multiple save slots or named games.
- Road variants and props, large power plant model.
- Anti-cheat of any kind.
- Automated tests of the scene and HUD.

## Further Notes

- **Naming rules**: no trademarked terms from other games anywhere in code, docs or UI; refer to "the reference game". Code identifiers and the glossary are in English; UI strings FR/EN.
- **Trademark check** of "Urbtopia" (INPI/EUIPO, classes 9/41/42) is still owed by the owner before any public release.
- **Open items from the asset catalog**: choose which Factory model is the large power plant; verify roundabout exits.
- **Balancing pass** is owed on production times, costs, and the pacing targets (first Shop and sales before 5 min, first Home before 10 min). The starting 600 Urbs exactly covers the first Home plus Power plant and Water tower, so any cost change must be re-checked.
- **Performance reference**: 60 fps at normal zoom and 47 fps at maximum zoom-out on a real phone with 250x250 tiles (no shadows, LOD off); the MVP map is 128x128, so there is headroom.
- Prototypes are uncommitted; move them to a throwaway branch once the repo has a first commit.
- Next step: `/to-tickets` on this spec.
