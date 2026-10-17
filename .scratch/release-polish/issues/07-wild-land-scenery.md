# Wild land scenery

Status: ready-for-agent
Blocked by: 02, 11
Spec: ../spec.md

## Acceptance criteria

- [x] Scenery of the Wild land (trees, rocks, hills, a rim at the edge of the map) generated from the city seed and the owned Parcels, per [ADR 0033](../../../docs/adr/0033-wild-land-scenery-derived-and-never-saved.md); nothing added to the save.
- [x] Rendered with chunked instancing from the nature models of issue 11; no hitbox, no obstruction, no interaction.
- [x] Buying a Parcel removes the scenery on it at once; the Wild land stays visibly different from owned land so what is buildable stays readable.
- [x] The ground texture is richer than today's single wild texture; the map edge no longer looks like an infinite plane.
- [x] Same city, same look across sessions and devices (deterministic test).
- [ ] Frame time measured on the reference phone and kept inside the budget of [ADR 0034](../../../docs/adr/0034-zero-cost-lighting-on-mobile.md).

## Progress

- `wildScenery` (core, pure): pieces per 4-tile cell from the seed, forests from low-frequency noise, a 40-tile rim of denser conifers and large stones; nothing on owned Parcels. Models come from the nature definitions through the new `scenery` role (`broadleaf`, `conifer`, `bush`, `rock`, `hill`), so issue 11 only has to keep the roles when it redraws them.
- `wildTerrain` (core, pure): coarse relief on cells of a third of a Parcel (about 5 tiles), irregular vertices (jittered lines, random diagonals, a height jitter per vertex) so the triangles differ in size and each one is visible, flat on and around owned Parcels, up to about 3 tiles inside the map and 9 on the rim. The ground is a flat-shaded mesh with per-face tint, fading out at the edge so the map no longer ends as a plane.
- Rendered by `WildScenery` through a second `ChunkedWorld` with 64-tile chunks; a light budget (`wantsAntialias()` false, hi-dpi phones) drops bushes and small stones.
- Forests are dense (several trees per 4-tile cell inside woods, placed at random spots so nothing lines up); relief amplitude is low (about 1.5 tiles inside the map, 4.5 on the rim). Measured on the dense reference city under SwiftShader with 32-tile scenery chunks: 811 to 879 draw calls (+8 %) and +65 % triangles with the full scenery; the light budget keeps half of the trees and drops bushes and small stones. Real frame time on the reference phone is still to measure (open box).
- Limit: the tile picking plane stays at y = 0, so a click on a hill of the Wild land lands slightly off; nothing is built there.
