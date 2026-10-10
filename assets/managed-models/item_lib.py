import math
import os
import shutil
import sys

LPM_DIR = os.path.expanduser("~/.claude/skills/blender-lpm-skill/scripts")
sys.path.insert(0, LPM_DIR)
import lpm  # noqa: E402

PALETTE_ENTRIES = [
    ("wood_light", "#d9a066"), ("wood", "#a8683a"), ("wood_dark", "#6e4222"),
    ("stone", "#a3a8ad"), ("stone_dark", "#6c7279"),
    ("clay", "#cf6a40"), ("clay_dark", "#a24d2c"), ("brick", "#b8452f"), ("mortar", "#e3d9c6"),
    ("coal", "#2a2b33"), ("coal_shine", "#5a5d6e"),
    ("fish_blue", "#5b9bd5"), ("fish_silver", "#cdd8e2"), ("fish_belly", "#f1f5f8"),
    ("gold", "#f4c430"), ("gold_dark", "#c4921a"),
    ("metal", "#b4bcc6"), ("metal_dark", "#667180"), ("steel", "#7d8ea3"),
    ("sand", "#ecd596"), ("sand_dark", "#cfb26a"),
    ("silicon", "#4b5069"), ("silicon_light", "#a3acd0"),
    ("cement", "#92928c"), ("cement_dark", "#6f6f6a"), ("paper", "#e8dfc9"),
    ("glass", "#bfe6f2"), ("glass_edge", "#6fc5d8"),
    ("crystal", "#a855f7"), ("crystal_light", "#e0b3ff"),
    ("tile_blue", "#3d7bd9"), ("tile_cream", "#fff1d6"),
    ("pcb", "#2fa36b"), ("pcb_dark", "#1f7a50"), ("chip", "#23242c"),
    ("tin", "#dde1e6"), ("tin_dark", "#9aa1ab"), ("label", "#e0533d"),
    ("red", "#d83a3a"), ("white", "#f6f8ff"), ("gem", "#5be0ff"),
]
PALETTE_NAMES = [name for name, _ in PALETTE_ENTRIES]


def color(name):
    return PALETTE_NAMES.index(name)


def build(model_id, make_parts, out_dir, budget=1500):
    """Build the parts returned by make_parts(), export <out_dir>/<model_id>.blend and .glb."""
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in PALETTE_ENTRIES])
    ob = lpm.finish(model_id, make_parts(), palette, budget=budget, center=False)
    work = os.path.join(out_dir, "_work")
    report = lpm.export_unity(ob, os.path.join(work, model_id), glb=True)
    for ext in ("blend", "glb"):
        shutil.move(os.path.join(work, f"{model_id}.{ext}"), os.path.join(out_dir, f"{model_id}.{ext}"))
    shutil.rmtree(work)
    return report


def ngon_ring(name, segments, radius, thickness, height, at, colour):
    """Closed ring made of boxes laid around the Z axis, standing flat."""
    x, y, z = at
    chord = 2 * radius * math.sin(math.pi / segments) * 1.08
    parts = []
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        part = lpm.box(f"{name}{i}", (thickness, chord, height), at=(radius, 0, 0), color=colour)
        lpm.rotate(part, math.degrees(angle) + 0.0, "Z")
        lpm.move(part, x, y, z)
        parts.append(part)
    return parts
