# 06: ⌘K search

**What to build:** Instant search across every Guide page, opened with ⌘K / Ctrl+K or a button.

**Blocked by:** 03

**Status:** done

- [x] JSON index per language (title, summary, section, keywords) produced at prerender time, loaded when the search opens.
- [x] Accent-insensitive matching shared with the Codex's `matchesSearch` (extracted, not duplicated).
- [x] Keyboard navigation of results; works on mobile.
- [x] No new dependency.

## Comments

- `<lang>/search.json` is written by the prerender (Mechanics pages, Codex sections, entries). The dev server computes the same index on the fly.
- `matchesSearch` moved to `src/codex/matchesSearch.ts`, shared with the in-game Codex. Title matches rank first, 20 results at most.
- MDX pages (issue 08) must add themselves to `searchIndexOf`.
