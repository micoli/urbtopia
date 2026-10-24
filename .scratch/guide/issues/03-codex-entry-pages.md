# 03: Every Codex entry as a Guide page

**What to build:** One prerendered page per Codex entry (Buildings by section, roads, water, crops, solar homes…), grouped like the in-game Codex sections, showing the PNG preview with a Tier and colour selector and the entry's facts.

**Blocked by:** 02

**Status:** done

- [x] Route catalogue derived from `CODEX_ENTRIES` and `CODEX_SECTIONS`; stable slugs.
- [x] Vitest: every entry has a page, no duplicate slug.
- [x] Section index pages list their entries with previews.
- [x] Tier and colour selectors swap the preview from `public/codex/manifest.json` without reload.

## Comments

- Paths: `<lang>/codex/<section>/<entry>/`. The section slug comes from its English title (`build.water` and `codex.water` would otherwise both be `water`); the entry slug is its id in kebab case.
- Codex index page lists the sections; the Trade section has no entry yet and says so (its rule pages come with issue 05).
- Entry page: large preview, Tier thumbnails as the Tier selector, colour chips for Homes, Level or Crop facts. Store-bound facts (build limits, annual events) wait for issue 04.
- The prerender renders every page in memory before writing, so a failure never overwrites the template.
