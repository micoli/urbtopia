# 07: "View in 3D" on Codex entry pages

**What to build:** A button on an entry page that lazy-loads a turntable view of the entry's `.glb` at the selected Tier and colour.

**Blocked by:** 03

**Status:** done

- [x] Three.js is a separate chunk, fetched only on click.
- [x] Drag to rotate, auto-rotate otherwise; falls back to the PNG if WebGL is missing.
- [x] Lighting consistent with the Codex previews.

## Comments

- `src/guide/viewer/turntable.ts` is imported on click only (its own chunk, with Three.js); it renders `codexSnapshot` with the same scene layers and lights as `scripts/codex-render.ts`.
- `ModelLibrary` takes the models URL (default unchanged for the game), since `./models/` does not resolve from nested Guide pages.
- Without WebGL the PNG stays, with a short notice.
