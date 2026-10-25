# 3D models for the new buildings and perennials

Status: ready-for-agent
Blocked by: 02, 03, 04

Use the `create-building-model` skill, one model at a time, shown in the live Blender at each step. English texts on signs; commit only on request.

- Livestock farm: 5 Tiers, repaintable four tones.
- Hive, Mulberry tree.
- Dairy, Textile mill, Knitwear factory (5 Tiers each).
- Then register with `add-building` and regenerate codex images (`npm run codex:generate`).
- Done when: every Tier has a model set in its definition.

## Progress

- Livestock farm: done (5 Tiers `livestock-farm-2x2-t1..t5-tone-a`, recipe `build_livestock`, one more fenced pen per Tier, four tones). Hive: done (5 Tiers `hive-1x1-t1..t5`, `build_hive`, one straw skep more per Tier, scattered seeded flowers, no platform). Mulberry tree: done (`mulberry-tree-1x1`, standalone recipe, one model scaled per Tier like the cherry tree). Remaining: Dairy, Textile mill, Knitwear factory, item icons.
