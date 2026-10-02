# 12: Isometric scene and camera

**What to build:** The player sees their starting city in an isometric 3D scene and can look around. Imperative three.js with an orthographic camera, chunked instancing (16x16 tiles), Kenney GLB models loaded through the asset catalog, driven by snapshots from a Zustand store. See ADR 0001 and `docs/asset-catalog.md`.

**Blocked by:** 11

**Status:** ready-for-agent

- [x] The pre-placed Workshop and Factory render with the correct footprint and front direction (-Z at rotation 0)
- [x] Ground and owned Parcels render; owned and unowned land are visually distinct
- [x] One finger pans, pinch zooms, two-finger twist snaps rotation by 90 degrees; buttons and Q/E, WASD/arrows, wheel work on desktop
- [x] Maximum zoom-out is bounded by a visible-triangle budget
- [x] Changing a building rebuilds only its chunk
- [x] The scene reads store snapshots and never imports core internals or React
- [x] Texture layout `models/<pack>/*.glb` with `Textures/colormap.png` works; node scales baked for water tower, detail tank and shipping containers
