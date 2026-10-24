# 08: MDX content, Getting started and Glossary

**What to build:** MDX pages per language that can embed live Codex components, with the English fallback, then the Getting started (game loop, Urbs, Tiers, Citizens) and Glossary pages.

**Blocked by:** 04

**Status:** done

- [x] One MDX file per page and per language.
- [x] Missing French page → English with a "not translated yet" banner; missing English page fails the build.
- [x] Glossary is player-facing and hand-written; nothing from `CONTEXT.md` is published.
- [x] MDX pages enter the search index.

## Comments

- `@mdx-js/rollup` in the Vite config and in the prerender's dev server; articles live in `src/guide/content/<section>/<slug>.<en|fr>.mdx` and export `meta = { title, summary, order }`. The slug `index` is the section's own page.
- `articlesOf` refuses a file outside `getting-started`, `mechanics` or `glossary` and an article without English, so the build fails; a missing French file shows the English text with a notice.
- MDX components: `EntryLink` (a Codex entry by id) and `MechanicsLink` (a rule page by id); they read the current route from `GuideRouteContext`.
- The reader settings bar shows on Codex and Mechanics pages only.
