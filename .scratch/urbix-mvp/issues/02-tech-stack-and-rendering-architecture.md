# Tech stack and rendering architecture

Type: prototype
Status: resolved
Blocked by:

## Question

Confirm TypeScript + Vite + three.js, with React for reactive UI. Decide: imperative three.js scene vs react-three-fiber; how React and the canvas exchange state; state management; test runner. Prototype an isometric orthographic scene with a few Kenney GLB pieces on a real phone to judge legibility and frame rate (instancing, BatchedMesh, low-detail models). Output: stack decision and an ADR if hard to reverse.

## Answer

- Stack: TypeScript + Vite + imperative three.js (no react-three-fiber), React for HUD/panels only, Zustand store between React and a headless sim core, Vitest.
- Rendering: orthographic iso camera, `InstancedMesh` per (chunk 16x16, model, sub-mesh), frustum-culled per chunk. 250x250 tiles reached 60 fps at normal zoom and 47 fps at max zoom-out on a real phone (no shadows, lod off). Plain instancing without chunks: 32 fps on desktop (84 M triangles).
- Distance LOD with Kenney low-detail models (~10x fewer triangles) is prototyped and held in reserve.
- Open: shadows not measured on phone; zoom limit and device classes go to later tickets.
- ADR: [0001](../../../docs/adr/0001-imperative-three-chunked-instancing.md). Prototype: `prototypes/render-bench/` (uncommitted, repo has no commit yet; move to a throwaway branch once the first commit exists).
