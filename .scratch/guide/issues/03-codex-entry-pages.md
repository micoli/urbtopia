# 03: Every Codex entry as a Guide page

**What to build:** One prerendered page per Codex entry (Buildings by section, roads, water, crops, solar homes…), grouped like the in-game Codex sections, showing the PNG preview with a Tier and colour selector and the entry's facts.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Route catalogue derived from `CODEX_ENTRIES` and `CODEX_SECTIONS`; stable slugs.
- [ ] Vitest: every entry has a page, no duplicate slug.
- [ ] Section index pages list their entries with previews.
- [ ] Tier and colour selectors swap the preview from `public/codex/manifest.json` without reload.
