# 06: ⌘K search

**What to build:** Instant search across every Guide page, opened with ⌘K / Ctrl+K or a button.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] JSON index per language (title, summary, section, keywords) produced at prerender time, loaded when the search opens.
- [ ] Accent-insensitive matching shared with the Codex's `matchesSearch` (extracted, not duplicated).
- [ ] Keyboard navigation of results; works on mobile.
- [ ] No new dependency.
