# 05: The 10 Codex rule pages in Mechanics

**What to build:** The economy, storage, energy, sanctions, market, challenges, solidarity, waste, politics and transit reach pages of the Codex appear as Mechanics pages, live with the reader settings.

**Blocked by:** 04

**Status:** done

- [x] Each page reuses its existing component from `src/ui/codex`.
- [x] Codex entry pages link to the matching Mechanics page as in the game.

## Comments

- Paths `<lang>/mechanics/<page>/`. The page list (`CODEX_PAGES`) moved to `src/codex/pages.ts`, shared by the game's Codex and the Guide.
- Each rule page that read the game store is split: `XPage` (game wrapper on `useGame`) renders `XRules({ state })`; the Guide renders `XRules` with the reader state. `BuildLimitRow` takes the state as a prop.
- Codex section and entry pages list the Mechanics pages of their section, so the Trade section is no longer empty.
