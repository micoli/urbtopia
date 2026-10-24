# 02: Theme, layout and language switch

**What to build:** The Guide's modern, quiet look: Tailwind v4, sans-serif font, one accent colour, light/dark from the system with a manual toggle, side navigation that collapses into a drawer on mobile, en/fr switcher sharing the game's language preference, "Play" button to the game.

**Blocked by:** 01

**Status:** done

- [x] Navigation shows the four sections: Getting started, Mechanics, Codex, Glossary.
- [x] Theme toggle persists per viewer; no flash of the wrong theme on load of a prerendered page.
- [x] Switching language keeps the current page (same slug, other language).
- [x] No horizontal scroll at phone width.
- [x] Does not reuse `codex.css`.

## Comments

- Tailwind v4 through the main Vite config, scanning only `src/guide` (`source(none)`), so the game's CSS is unchanged.
- Theme tokens on `:root` and `[data-theme="dark"]`; an inline script in `docs/index.html` sets `data-theme` before paint. The toggle stores `urbtopia-guide-theme`; with nothing stored the system theme is followed live.
- Reused game components are styled through element rules under `.guide-content` (dl, table, headings).
