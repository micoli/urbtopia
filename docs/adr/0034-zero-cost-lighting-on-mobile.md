# Lighting improvements must cost almost nothing on mobile

Accepted. Extends [ADR 0001](0001-imperative-three-chunked-instancing.md), which stays valid.

The scene gets depth from techniques that cost nearly nothing at runtime: fake "blob" shadows drawn as instances, ambient occlusion baked into vertex colors, and light fog. Real-time shadow maps and full-screen post-processing (SSAO, bloom) are excluded.

The acceptance bar is measured on a reference phone on the same dense city, before and after, with a performance trace and the render budget: at most +5 % on the median frame time. Above it, the feature is switched off automatically on slow devices, using the `low-power` detection already in place.

## Why

- The game targets phones and tablets first. Battery and heat matter more than a richer image.
- A measurable bar ends the argument about "no impact".
- Baked data and instances reuse what the chunked rendering already does.

## Consequences

- A look that needs real shadows is out of reach.
- A feature that fails the bar ships off by default on slow devices, so the look differs by device.
- Every new lighting feature must carry its before/after measurement.
