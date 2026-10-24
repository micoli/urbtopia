# 12: "Open in the Guide" from the in-game Codex

**What to build:** A button on each Codex entry and page in the game that opens the matching Guide page, in the current language, in a new tab.

**Blocked by:** 05

**Status:** done

- [x] URL built from the same route catalogue as the Guide.

## Comments

- `CodexGuideLink` in the Codex header opens `docs/<lang>/...` of the shown entry or rule page in a new tab. A Mechanics article that replaced a rule page keeps its URL, so the link still lands on it.
- Path builders live in `src/guide/paths.ts`, free of MDX, so the game bundle does not carry the articles; `routes.ts` re-exports them.
