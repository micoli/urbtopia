# 14: Touch build UX (HUD layout C)

**What to build:** The player builds from the default HUD (layout C): left dock with stats and categories, flyout of build items, side panel for selection, ghost at screen centre with a check/cross pad. React HUD over the store; scene API for the ghost. Prototype reference: `prototypes/touch-ux` (throwaway, not to be promoted).

**Blocked by:** 13

**Status:** ready-for-agent

- [x] Picking an item places a ghost at screen centre; panning moves it; tapping a tile recentres it
- [x] Ghost is green when valid and red when invalid, with the refusal reason shown
- [x] Confirming with the check places the building and stays in build mode
- [x] Tap a building opens the side panel with its details
- [x] The dock shows Urbs; one React component per file
- [x] All tap targets are at least 44 px
- [x] The HUD is a layer over the store and scene API, so other layouts can be swapped in later
