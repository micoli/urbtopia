# Knowledge and Libraries

Status: ready-for-agent

Vocabulary: `CONTEXT.md` (Knowledge, Schooling, Library, Sanction, Difficulty). Decision: `docs/adr/0055-knowledge-rewards-everywhere-and-is-sanctioned-only-on-hard.md`.

## Behaviour

- **Knowledge of a Home** (0 to 100, derived, never saved): `100 - (100 - schooling) * (1 - library / 100)`.
  - Schooling: School 15, Middle school 15, High school 20, University 20. A degree counts once however many facilities of it cover the Home.
  - Library: 6, 12, 18, 24, 30 for the Tier of the covering Library (best one wins; Libraries do not stack).
- **City Knowledge**: mean of the Homes' Knowledge weighted by `citizensOf(tier)`. A city with no Citizens has no Knowledge (null, no effect).
- **Effects at city Knowledge 100**, concave curve (70% of the effect at 50): Industry building production speed +25%, Office Urbs +25%, Tax +5%, Well-being +8 points, Waste per Citizen -20%, power demand and Climate emissions -10%. Balance numbers live in `assets/defs/balance/knowledge.json` with a schema.
- **Hard only**: new sanctionable factor `knowledge`. Satisfaction of a Home = `min(100, Knowledge * 2)`. Sanction is the usual Tax reduction (floor half of Tax), no extra Well-being malus, never takes Citizens away, suspended during an Adaptation period.
- **Library**: Public facility, category `education`, 2x2 at Tiers 1-2, 3x2 at 3-4, 4x2 at 5; cost 400 Urbs, unlock 40 Citizens, power 2, radius 10 growing 2 per Tier to 18, capacity 300/500/800/1200/1800. Never required. It must NOT count as Education coverage: Education Need factor, the required School at Tier 3 and the Well-being service units keep meaning "a School covers the Home".
- No save migration: nothing new is stored.

## Out of scope

Approval, Tourism, Agriculture and Construction effects of Knowledge (later batch). Final 3D models (ticket 09).

## Conventions to respect

CLAUDE.md: tokens/`@layer legacy` CSS, `cva` variants, `<Icon>` registry, one React component per file, `?e2e` and `--headed` for Playwright. English in code, early returns, minimal comments.
