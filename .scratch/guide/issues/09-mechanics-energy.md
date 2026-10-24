# 09: Mechanics page — Energy

**What to build:** Hand-written page explaining power production, demand, storage and shedding, embedding the energy forecast chart and sources table.

**Blocked by:** 05, 08

**Status:** done

## Comments

- `mechanics/energy.<lang>.mdx`. A Mechanics article whose slug is a rule page's slug replaces that page (same URL) and embeds its live figures with `<LiveRules id="energy" />`.
- GFM tables through `remark-gfm`; the MDX plugin lives in `build/guideMdx.ts`, shared by Vite and the prerender.
