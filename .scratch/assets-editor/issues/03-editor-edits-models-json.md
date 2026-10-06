# Editor edits models.json across all sources

Status: ready-for-agent
Spec: [assets-editor](../spec.md)
Blocked by: 02

Vite plugin `GET/PUT /api/models` with atomic stable writes; list the 4 sources with filters and indicators; edit footprint, scale/fit, rotation offset, bake flag, note, license fields; recolor picker with live preview using the `ModelLibrary` shader. Remove `localStorage` and export.
