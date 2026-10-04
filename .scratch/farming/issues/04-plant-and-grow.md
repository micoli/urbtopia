# Planting by sprinkling and growth

Status: ready-for-agent
Blocked by: 02, 03
Spec: ../spec.md

## What to build

Dragging the brush with the selected species plants every empty Field tile touched, one Seed pack each. Crops grow with the game clock, including Catch-up, and add water Demand while growing.

## Acceptance criteria

- [ ] Planting skips planted tiles and stops when the seed stock is empty.
- [ ] Planting is refused when the extra water Demand would exceed water Capacity; the water invariant tests still hold.
- [ ] A Crop stores species and planting time; stage and readiness are derived from the clock, never saved.
- [ ] Growth is applied through `advance` and Catch-up (max 48 game hours).
- [ ] Water Demand is per planted tile, constant until ready, zero when ready.
- [ ] Four growth stages and the ready stage are visible in the scene with placeholder models.
- [ ] Tests: planting, stock exhaustion, water refusal, Catch-up growth.
