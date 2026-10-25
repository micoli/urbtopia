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

- Livestock farm: done (5 Tiers `livestock-farm-2x2-t1..t5-tone-a`, recipe `build_livestock`, one more fenced pen per Tier, four tones). Remaining: Hive, Mulberry tree, Dairy, Textile mill, Knitwear factory, item icons.
