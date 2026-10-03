# Touch UX and HUD

Type: prototype
Status: resolved
Blocked by: 02

## Question

Prototype camera controls (pan, pinch zoom, rotate), build mode, selection, and the React HUD (resources, build menu, production panels) for touch first, mouse and keyboard second. Decide layout across phone, tablet and desktop.

## Grilling round 1 (settled, "ok pour tout")

- Camera: 1 finger pan, pinch zoom, 2-finger twist snaps rotation by 90° (also buttons, Q/E, WASD/arrows, wheel).
- Build: pick item, ghost sits at screen centre, pan to position, tap a tile recentres, ✓/✗ pad; stays in build mode after ✓. Roads: L-drag stays as in ticket 06 (not prototyped).
- Select: tap building opens details (variant-dependent container); floating collect badges above ready buildings, tap collects.
- Variants: A bars + bottom sheet, B minimal + radial menu (long press or FAB), C left dock + side panel. Devices: real phone via `--host`, devtools for tablet/desktop, tap targets >= 44 px.

## Prototype

`prototypes/touch-ux` (`npm run dev`, port 5174 used so far). Variants via `?variant=A|B|C`, Shift+←/→ to switch. Fake state, no simulation. Throwaway, not promoted to production.

## Answer

- **Default HUD layout = variant C** (left dock with stats and categories, flyout for build items, side panel for selection, ✓/✗ confirm pad). Variants A (bars + bottom sheet) and B (minimal + radial menu) are **kept as selectable HUD layouts in the preferences**, so the HUD is a swappable layer over the same store and scene API.
- Interaction model validated as prototyped: 1-finger pan, pinch zoom, 90° snapped rotation (buttons, keys, twist), ghost at screen centre + tap to recentre + ✓/✗, floating collect badges, selection panel.
- Caveats: touch gestures and the 90° twist were not yet verified on a real phone; C on a phone (< 600 px) leaves little map next to the 64 px dock plus the flyout, to be checked in the spec.
- The prototype ignores model footprints (every building is 1x1 on a tile centre) and does not draw Parcels; footprints and placement stay governed by the asset catalog and the city grid ticket.
