# 02: Theme, layout and language switch

**What to build:** The Guide's modern, quiet look: Tailwind v4, sans-serif font, one accent colour, light/dark from the system with a manual toggle, side navigation that collapses into a drawer on mobile, en/fr switcher sharing the game's language preference, "Play" button to the game.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Navigation shows the four sections: Getting started, Mechanics, Codex, Glossary.
- [ ] Theme toggle persists per viewer; no flash of the wrong theme on load of a prerendered page.
- [ ] Switching language keeps the current page (same slug, other language).
- [ ] No horizontal scroll at phone width.
- [ ] Does not reuse `codex.css`.
