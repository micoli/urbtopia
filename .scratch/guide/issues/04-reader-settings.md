# 04: Reader settings instead of the player's city

**What to build:** Global Difficulty (default Medium) and Citizens (default 0) settings, kept in the query string, that feed a neutral game state to the Codex components which read the city today (`useGame`).

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The Guide never reads the save nor the game's storage.
- [ ] Codex components that use `useGame` render in the Guide from the neutral state (provider or injected state, no fork of the components).
- [ ] Changing a setting updates the figures live and the URL; a shared link reproduces them.
- [ ] Prerendered HTML uses the defaults.
