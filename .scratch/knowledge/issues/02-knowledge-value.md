# 02 Knowledge of a Home and of the city

Status: resolved
Blocked by: 01

New `src/core/services/knowledge.ts` (or `environment/`) + `assets/defs/balance/knowledge.json` + schema. Red first, table-driven:
- no facility -> 0; School only -> 15; all four degrees -> 70; two Schools count once;
- Library Tier 1..5 alone -> 6..30; Library + all degrees -> 100 - 30 * (1 - 0.30) = 79; formula matches the spec for mixed cases;
- two Libraries cover a Home -> the higher Tier wins;
- a Home served only through Transit reach counts;
- city Knowledge is Citizen-weighted (a Tier 8 Home weighs more than a Tier 1); no Homes -> null.
Public interface: `homeKnowledge(state, home, coverage?)`, `cityKnowledge(state)`. Reuse the coverage passed around like `homeBenefits` and cache per state with a `WeakMap` as it does.

## Answer

Done, see the commit of this ticket in the history (`git log --grep` on its title).
