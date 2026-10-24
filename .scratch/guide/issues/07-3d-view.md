# 07: "View in 3D" on Codex entry pages

**What to build:** A button on an entry page that lazy-loads a turntable view of the entry's `.glb` at the selected Tier and colour.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Three.js is a separate chunk, fetched only on click.
- [ ] Drag to rotate, auto-rotate otherwise; falls back to the PNG if WebGL is missing.
- [ ] Lighting consistent with the Codex previews.
