# 04: Reader settings instead of the player's city

**What to build:** Global Difficulty (default Medium) and Citizens (default 0) settings, kept in the query string, that feed a neutral game state to the Codex components which read the city today (`useGame`).

**Blocked by:** 03

**Status:** done

- [x] The Guide never reads the save nor the game's storage.
- [x] Codex components that use `useGame` render in the Guide from the neutral state (provider or injected state, no fork of the components).
- [x] Changing a setting updates the figures live and the URL; a shared link reproduces them.
- [x] Prerendered HTML uses the defaults.

## Comments

- `src/guide/reader/`: settings store (URL query first, then `sessionStorage`, so they follow the reader from page to page), and `readerStateOf`, a new game on a fixed clock with Homes added greedily to reach the chosen size (at most 5 Citizens over).
- Citizens slider steps through the distinct unlock thresholds of the Codex.
- Game components keep reading the game store through thin wrappers; the Guide renders the inner view with the reader state (`BuildLimitFacts` → `BuildLimitList`). Issue 05 does the same for the rule pages.
- Settings apply after hydration, so the prerendered HTML always shows the defaults.
