# Move the viewer to tools/assets-editor

Status: ready-for-agent
Spec: [assets-editor](../spec.md)

Move `prototypes/asset-viewer` to `tools/assets-editor`, give it its own dependencies (no symlinked `node_modules`), add the root script `npm run assets:editor`, and update `scripts/prototypeAssets.ts`, `scripts/prototype-assets.ts`, docs and `.gitignore`. Build and tests stay green.
