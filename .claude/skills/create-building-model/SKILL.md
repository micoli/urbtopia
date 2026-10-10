---
name: create-building-model
description: Create a low-poly 3D building model for Urbix (individual house, apartment block or office block) in Blender, in the style of the game's suburban Kenney models (default) or in a vivid saturated style. Asks the style, footprint in tiles, floors, type, colors, wing or cross gable, distinctive elements and roof style, then writes <id>.blend, <id>.glb and the Python recipe to assets/managed-models/buildings/ and shows it in the live Blender at every step. Use when the user wants to model, generate or draw a new building. Does not register the model in the game; add-building does.
---

# Create a building model

Talk to the user in French. Code, identifiers and comments in English, comments only when the code is ambiguous. Never use trademarked game names (SimCity terms). Built on `blender-lpm-skill` (`~/.claude/skills/blender-lpm-skill`); read its `SKILL.md` when a step below is unclear.

Output, committed by the user, never by you: `assets/managed-models/buildings/<id>.blend`, `<id>.glb`, `<id>.py` (the recipe). `assets/models.json` is not touched.

Units: **1 tile = 1 world unit**. Z up, front = −Y (becomes +Z in the glb).

## 1. Gather inputs

Ask with `AskUserQuestion` (at most 4 questions per call, so two or three calls) and skip any answer the user already gave.

- **Style** (`style`): `kenney` (default) matches the suburban Kenney models of the game, `vivid` is the saturated, fine-trim style. Ids of a `vivid` variant end in `-vivid`.
- **Footprint** in tiles, width × depth (for example 2×3), the bounding box of the whole building, wing and bay included. The roof of each volume covers its footprint exactly (the walls are the overhang smaller: 0.06 tile per side in `kenney`, 0.04 in `vivid`). Kenney houses are about 1 tile wide.
- **Floors**: house 1–3, apartment block 3–12, office block 4–20. Outside the range, ask for confirmation and continue if the user insists.
- **Type** (`kind`): `house` (individual house), `apartment` (apartment block), `office` (office block). Floor heights: 0.30, 0.28 and 0.32 tile. A monumental door is one floor high.
- **Colors**: wall, roof, and optionally trim, door and accent, from `PALETTE_ENTRIES` in `scripts/building_lib.py`. `kenney` defaults: offwhite walls, softgreen roof, slate trim, slate_dark door, softgreen accent, glass_blue glass; a charcoal variant is `wall: slate_dark, roof: slate, trim: offwhite`; `bluegrey` (grey-blue) and `salmon` (orange-pink) are light wall colors, for example `-b` = `wall: bluegrey, roof: softgreen` and `-c` = `wall: salmon, roof: brick, accent: brick`. `vivid` defaults: coral, brick, cream, navy, sun. The vivid cells (coral, tangerine, sun, lime, mint, aqua, sky, cobalt, violet, magenta, pink, cream, white, graphite, brick, navy) work in both styles. Several variants means one file per variant, suffixed `-a`, `-b`, `-c`, from the same recipe with different colors.
- **Volumes**: `wing` (an L plan: `{"side": "left", "width": 0.8, "depth_ratio": 0.65, "floors": 1, "roof": "gable_half", "garage": true}`; flush with the front, the face against the main volume gets no window; `garage` adds a garage door) and the roof `gable_cross` (a front gable bay over the entrance, `bay_depth` 0.3 by default, `bay_width` half of the main width up to 1 tile; needs a main volume at least as wide as deep; the door and the front elements move to the bay).
- **Distinctive elements**, a multi-select among: `sign` (colored board; optional `text` made of the letters ABCDEFGHIJKLNOPRSTUVXYZ, drawn as pixel decals, for example `{"type": "sign", "text": "shop"}`; with an `awning` the board sits above it and the upper windows it would cover are dropped; add `"placement": "roof"` for a board standing on a flat roof), `chimney`, `vent` (hexagonal roof vent), `antenna`, `awning`, `balcony`, `skylight`, `solar_panels` (3×2 dark panels on the visible slope of a `gable_half`, `gable_third` or `shed` roof), `bushes` (round bushes at the foot of the corners), `monumental_door`. Ask the face (`front`, `back`, `left`, `right`, default `front`) for `sign` and `balcony`.
- **Window sizes** (`window_sizes`): `same` (all windows of a row alike) or `varied` (width varies by column, height by floor, seeded). Windows are always evenly spread along each façade.
- **Roof**: `flat`, `gable_half` (ridge in the middle), `gable_third` (ridge at 1/3 of the depth: 1/3 + 2/3), `hip` (4 slopes, pyramid on a square footprint), `shed` (one slope, low at the front), `gable_cross` (see volumes), `mansard` (steep lower slope with dormer windows on the front and back, and on the sides from 1.8 tiles; adds an attic level on top of the floors). Roofs are closed solids with closed gables and a closed underside: no hole under a roof.
- **Id**: kebab-case from kind, footprint, floors and roof, for example `house-2x2-2f-gable-a`. Propose it and let the user change it.

Confirm with a one-line recap (style, kind, footprint, resulting size in tiles, floors, roof, volumes, colors, elements) before generating.

## 2. Write the recipe

Copy `recipe.template.py` to `assets/managed-models/buildings/<id>.py`, fill the `__PLACEHOLDERS__` (`__STYLE__` is `kenney` or `vivid`, `__WINDOW_SIZES__` is `same` or `varied`, `__COLORS__` is the `"wall": "..."` pairs to override or nothing, `__WING__` is `None` or the wing dict) and fill `features`, for example `{"type": "sign", "face": "front"}`. The recipe imports `scripts/building_lib.py` and writes next to itself. Do not duplicate the art direction in the recipe.

Art direction, owned by `building_lib.py` (`STYLES` table), identical for every building of a style:
- **kenney**: chunky and calm like the game's suburban models. Off-white walls with a single accent color, thick slate trims, a thick base band and thick belt course between floors, thick roof slab with a big overhang and a generous fillet, gables (the wall under a pitched roof) in wall color and flush with the facade plane, under a thin roof slab whose verge overhangs by 0.03 tile (0.02 in `vivid`) while the eaves overhang by 0.06, few big windows (one mullion, blue glass, rounded slate frame, no sill, no cornice), a door with a rounded surround and a round handle. Windows, doors and their frames sit almost flush with the wall (frames and door stand out 6 to 10 mm, glass and mullions a few mm more). About 1 000 triangles for one tile and two floors.
- **vivid**: saturated colors, fine cream trims, a cornice, belt courses, framed windows with panes (2×3 on houses, 2×2 on apartments, 3×1 ribbon on offices), a slight fillet on the roof edges.
- both: one 23-cell palette and one flat material, walls with 2-segment rounded vertical corners, windows evenly spread (with `varied` sizes drawn from a seed: `seed` in the spec, default the id, so a regeneration gives the same façade), a 35° roof pitch (mansard: 72° lower slope, 25° upper slope; shed: 18°), doors and the main sign on the front.

## 3. Generate

```bash
python ~/.claude/skills/blender-lpm-skill/scripts/bl.py --script assets/managed-models/buildings/<id>.py
```

`build()` refuses an open mesh (every solid is checked, only window faces are exempt) and ends with `<id>.blend` and `<id>.glb`; the FBX and texture byproducts are discarded. A Python error names the fault; fix the recipe or the library and rerun.

## 4. Show it in Blender, at every step

The user follows the creation in the live Blender. After **every** generation (the first one and each correction round), reload the building there in material shading and look at it. Load `mcp__blender__execute_blender_code` and `mcp__blender__look` with `ToolSearch` first.

Before the first reload, tell the user once that the scene of the open Blender file will be replaced, and continue unless they object. Never call `bpy.ops.wm.read_factory_settings` in the live Blender: it unloads the MCP addon and drops the connection until the user restarts the server. To show several models together, import their `.glb` files (`bpy.ops.import_scene.gltf`) into the open scene, or build the comparison headless with `bl.py`. Then run:

```python
import bpy
bpy.ops.wm.open_mainfile(filepath="<absolute path>/<id>.blend")
for window in bpy.context.window_manager.windows:
    for area in window.screen.areas:
        if area.type != "VIEW_3D":
            continue
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
        with bpy.context.temp_override(window=window, area=area, region=next(r for r in area.regions if r.type == "WINDOW")):
            bpy.ops.view3d.view_all()
```

Then call `mcp__blender__look` with `mode: "angles"`, `shading: "material"` and `views: ["front", "three_quarter", "back", "top"]` (`max_size` 512), and judge it: silhouette, roof (no gap, gables closed, fillets), readability of colors, the vivid look. Say in one line what you see and what you change.

Loop, at most 3 correction rounds: change the recipe (colors, elements, roof, window sizes) without asking the first questions again, regenerate (step 3), reload and look again. Ask the user to accept or refuse after each look. After 3 refused rounds, stop and ask what is wrong.

If the Blender MCP is not connected, fall back to the headless contact sheet and tell the user to open `<id>.blend` and press Z then Material Preview:

```bash
python ~/.claude/skills/blender-lpm-skill/scripts/bl.py --script ~/.claude/skills/blender-lpm-skill/scripts/render_views.py -- --input assets/managed-models/buildings/<id>.glb --out $CLAUDE_JOB_DIR/tmp/views --views quarter,front,back,top --size 512
```

and show `sheet.png` with `Read`.

## 5. Gates

```bash
S=~/.claude/skills/blender-lpm-skill/scripts; K=.claude/skills/create-building-model/scripts
python $S/bl.py --script $S/inspect_scene.py -- --input assets/managed-models/buildings/<id>.blend --out $CLAUDE_JOB_DIR/tmp/<id>.inspect.json
python $S/gate_report.py $CLAUDE_JOB_DIR/tmp/<id>.inspect.json --class environment-module --budget <budget>
python $S/bl.py --script $K/check_footprint.py -- --input assets/managed-models/buildings/<id>.glb --width <w> --depth <d> --floors <n> --kind <kind>
```

`<budget>` is printed by the generation (`lpm_budget`). The loose-parts and non-manifold WARN are expected: the solids overlap on purpose and window or sign-text faces are open decals. Every other line must be PASS, and the footprint check must give `"pass": true` (footprint within 2 %). On a failure, fix the recipe and rerun, at most 3 times, then ask the user.

## 6. Report

Say: files created, triangles against budget, final size in tiles (width × depth × height), and the values to enter in `assets/models.json` for the model (`footprint`: [w, d]; `fit` or `scale` only if the game shows it wrongly). Check the facing in the game once: if the door is not on the street side, set `rotationOffset`. Propose to continue with the `add-building` skill (category, unlock threshold, price). Do not commit unless the user asks.
