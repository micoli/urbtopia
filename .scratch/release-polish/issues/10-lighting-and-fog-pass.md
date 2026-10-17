# Lighting, fog and runtime harmonisation

Status: ready-for-agent
Blocked by: 02
Spec: ../spec.md

## Acceptance criteria

- [ ] Blob shadows as instances, ambient occlusion baked into vertex colors, light fog; no shadow maps, no full-screen post-processing ([ADR 0034](../../../docs/adr/0034-zero-cost-lighting-on-mobile.md)).
- [ ] Runtime harmonisation (tint, tone) of the kept assets: the Kenney Venue models, vehicles, boats, roads and rails, and the Quaternius Goods, Materials and Crops.
- [ ] Before/after performance trace on the reference phone, same dense city; median frame time at most +5 %, otherwise the feature is off by default on slow devices through the existing `low-power` detection.
- [ ] The palette of the replaced Buildings is checked under this lighting; the control render of issue 01 already uses it.
- [ ] The measurement is recorded in the issue; baselines updated.
