# Blender toolkit

Low-poly modelling toolkit used by the recipes in `assets/managed-models/` and by the `create-building-model` skill. Extracted from the personal `blender-lpm-skill` so that every committed model can be regenerated from the repository alone.

- `bl.py`: runs Blender headless (`$BLENDER_EXE`, then the default macOS/Windows install, then `blender` on the PATH; Blender 5.2).
- `lpm.py`: primitives (`box`, `prism`, `lathe`, `sweep`, `plate`), deformers, `finish()` (one palette material, UVs per cell, budget check) and `export_glb()` (`<stem>.blend` + `<stem>.glb`).
- `inspect_scene.py`, `gate_report.py`: measure a `.blend` and check it against a triangle budget.
- `render_views.py`: orthographic views and a contact sheet.

Run a recipe: `python tools/blender/bl.py --script assets/managed-models/buildings/<id>/<id>.py`.
