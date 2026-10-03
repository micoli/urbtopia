# Imperative three.js scene with chunked instancing, React for UI only

The 3D scene is plain three.js (no react-three-fiber), rendered with an orthographic isometric camera. React owns only the HUD, panels and menus. The headless simulation core is pure TypeScript and talks to React through a thin Zustand store (commands in, snapshots out). Tests run on Vitest, Vite is the bundler.

World geometry is drawn with `InstancedMesh` grouped by chunk (16x16 tiles): one instanced mesh per (chunk, model, sub-mesh), each with its own bounding sphere so three.js frustum-culls whole chunks. A map up to 250x250 tiles is the target ceiling.

## Why

Measured with the throwaway bench in `prototypes/render-bench` (Kenney commercial + road GLBs, 250x250, no shadows):

- Desktop Chrome: plain instancing 32 fps (84 M triangles per frame, all instances processed even off-screen); chunked 16: 120 fps cap, 3 M triangles.
- Real phone: chunked 16, lod off: 60 fps at normal zoom, 47 fps at maximum zoom-out. Earlier runs in chunk 32 and 16 gave 28-35 fps at the start zoom, so the zoom range and chunk size matter.
- Per-model naive meshes are unusable at this scale (tens of thousands of draw calls).
- Kenney low-detail models cost ~10x fewer triangles (0.28 M vs 3.0 M visible), so distance LOD is a proven fallback if needed.

Imperative three.js was chosen over react-three-fiber because chunk rebuilds, instance matrices and culling need direct control, and React re-renders must stay off the render path.

## Consequences

- Building or demolishing rebuilds only the affected chunk.
- Maximum zoom-out is bounded by a visible-triangle budget; the exact zoom limit is decided in the touch UX ticket.
- Distance LOD (low-detail models beyond a radius from the view centre) is implemented in the prototype but not adopted yet; enable it only if device testing below 47 fps requires it.
- Shadows were not part of the phone measurements; treat them as off until measured.
- The render path must not depend on React or on the simulation internals: the scene reads snapshots.
- Device measured: a single phone (model not recorded). Performance budgets per device class stay in the map's fog.
