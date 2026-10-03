# Map: Urbix MVP

Label: wayfinder:map

## Destination

A spec for the **playable MVP** of Urbix, ready for `/to-spec` then `/to-tickets`: the core loop road → building → production → sale → upgrade, playable on phone, tablet and desktop in the browser, with no server.

## Notes

- Isometric 3D city builder, resource production chains, building and (later) transport management. Mechanics are inspired by a well-known mobile city builder; see `docs/research/reference-city-builder-mechanics.md`.
- **Never use the reference game's trademarked names** (game title, currencies, building brands, etc.) in docs, code, UI or files. Invent original names (see ticket "Name the universe"). Refer to it as "the reference game".
- Assets: Kenney City Kits (commercial, industrial, suburban, roads), CC0. See `docs/research/kenney-city-kits.md`.
- No server. Persistence in localStorage (and/or IndexedDB if justified) plus JSON export/import.
- Game progresses in real time via a saved timestamp, caught up on reopen (no continuous background simulation).
- No premium currency in the MVP. Solo only.
- UI is bilingual FR/EN, strings extracted from the start. Code and comments in English.
- Stack direction: TypeScript + Vite + three.js for the 3D scene, **React for reactive UI elements** (HUD, panels, menus). The exact split between React and the canvas is a decision ticket.
- Keep simulation core free of rendering and React so it can be tested headless.
- Skills for sessions: `grilling` and `domain-modeling` for HITL tickets; update `CONTEXT.md` as terms resolve.

## Decisions so far

<!-- one line per resolved ticket: [title](issues/NN-slug.md): gist -->

- Destination = MVP spec. (grilling round 1, no ticket)
- MVP scope = road/building loop, factories, shops, homes (6 tiers), power, water, storage, population-gated unlocks, NPC market. Coverage services and heavy transport come right after.
- Real-time with timestamp catch-up on reopen.
- No premium currency in the MVP.
- Bilingual FR/EN from the start.
- [Name the universe](issues/01-name-the-universe.md): game is **Urbtopia** (trademark check still to do by the owner), currency **Urbs**, building vocabulary Workshop/Factory/Shop/Storehouse/Home/Power plant/Water tower/Market; glossary in `CONTEXT.md`.
- React for reactive UI.
- [Tech stack and rendering architecture](issues/02-tech-stack-and-rendering-architecture.md): imperative three.js + chunked instancing (16x16), Zustand + headless core, Vitest; 250x250 holds 47-60 fps on a phone; LOD in reserve; see ADR 0001.
- [Simulation model and time](issues/03-simulation-model-and-time.md): pure core with injected `now`, slots with manual collect, one `advance` path for play and catch-up (event replay, capped at 48 h, excess forfeited), clamped backward clock, seeded PRNG with stored state, `dispatch(command, now)` boundary; see ADR 0002.
- [Save format and persistence](issues/04-save-format-and-persistence.md): localStorage behind `SaveStore`, versioned envelope with pure migrations and validation, list-based state (derived data rebuilt), one slot plus backup, debounced autosave, JSON export/import via the reopen path, single active tab; see ADR 0003.
- [Asset catalog and orientation](issues/05-asset-catalog-and-orientation.md): front = -Z, footprint `ceil(bbox-0.15)` native, 8 base road pieces, roles for commercial/suburban/industrial, Towers separate from Home tiers; see `docs/asset-catalog.md`.
- [City grid and placement rules](issues/06-city-grid-and-placement-rules.md): fixed 128x128 flat map in 16x16 parcels (start 2x2 owned, buy adjacent parcels in Urbs, geometric cost), façade-on-road rule with auto-orientation, L-drag roads with auto pieces, sell refunds 75 %, moving resets production.
- [Economy and production chains](issues/07-economy-and-production-chains.md): 5 Materials (1-16 min), 6 one-level Goods, generic buildings with FIFO slots (2 to 5, bought in Urbs), one Storehouse with two compartments, Shop (3 slots, full price, slow) vs Market (panel, 60 %, saturating), manual tax 1 Urb/citizen/h capped 8 h, start 600 Urbs.
- [Population, homes and utilities](issues/08-population-homes-and-utilities.md): Homes placed tier 1 (150 Urbs), 6 tiers instant upgrade with Urbs + Goods, 6 to 160 Citizens; global power/water pools (Power plant 250 / Water tower 200, capacity 12), Homes only consume; placement, upgrade and plant/tower sale refused if demand would exceed capacity, so no shortage or abandonment in the MVP; Parcels 300 x 1.12^n.
- [Progression and unlocks](issues/09-progression-and-unlocks.md): total Citizens is the only metric (no XP, no objectives); start open with Wood/Stone, Planks/Bricks and all base buildings; Clay+Tiles at 30, Metal+Tools at 80, Silicon+Glass+Circuits at 200; Parcels gated by cost only; HUD shows next threshold; no end state, sandbox.
- [Touch UX and HUD](issues/10-touch-ux-and-hud.md): HUD layout **C** (left dock + flyout + side panel) by default; A (bars + bottom sheet) and B (minimal + radial menu) kept as layouts selectable in preferences; pan / pinch / 90° snapped rotation, ghost at screen centre with ✓/✗, floating collect badges; prototype in `prototypes/touch-ux`.

## Not yet specified

- Transport beyond roads (buses, rail, ports, airport) and traffic effects.
- Coverage services (fire, police, health) and their balancing.
- Education, parks, special buildings.
- Onboarding / tutorial and first-session pacing.
- Audio, day/night, visual polish.
- PWA install and offline caching of assets.
- Performance budgets per device class.
- Large power plant model (pick among Factory models) and roundabout exit check (see asset catalog, Open).
- Balancing pass on production times and costs (starting numbers in ticket "Economy and production chains").
- Multiple save slots / named games.
- Preferences screen: language, HUD layout (C / A / B), and what else belongs there; real-device check of touch gestures and the phone layout of C.

## Out of scope

- Multiplayer, trading between players, global market, clubs, leaderboards, events (no server).
- Regions / multi-city.
- Premium currency and in-app purchases.
