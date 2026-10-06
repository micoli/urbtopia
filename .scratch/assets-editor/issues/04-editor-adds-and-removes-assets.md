# Editor adds and removes assets

Status: ready-for-agent
Spec: [assets-editor](../spec.md)
Blocked by: 03

Modules in `scripts/` (`addGlb`, `importPolyPizza`, `addPack`, `removeModel`) tested on a temp directory, exposed by the Vite plugin; UI for GLB drop, Poly Pizza import, zip drop, removal guarded by `MODEL_KEYS`; license required; run `npm run assets` after an add.
