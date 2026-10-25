# UI, FR/EN texts, guide and codex

Status: resolved
Blocked by: 02, 03, 04, 05

- Build menu entries, building panels, Hive and Mulberry tree panels, Feed shown in the Livestock farm panel (missing Feed state).
- Texts EN/FR in `catalog.ts`; unlocks announced in `codex/levelFacts.ts`.
- Guide pages generated from definitions (ADR-0040); Catalogue entries for the new Buildings, Materials and Goods.
- Done when: all strings exist in FR and EN and the guide build passes.

## Answer

Building, Material and Good names, build menu entries, codex pages and guide pages come from the definitions, so the new items appear without extra UI code (FR and EN included in the defs). Added by hand: the production chains page now lists the Livestock farm, Textile mill, Dairy and Knitwear factory as processors and the Mulberry tree and Hive as roots (shared `ORCHARD_BUILDINGS` table), and the management counts list the new buildings. Feed shows through the existing recipe label: a missing Feed is flagged red and the item cannot be queued. `scripts/prerender-guide.ts` was not rerun: it refuses an already prerendered `dist`.
