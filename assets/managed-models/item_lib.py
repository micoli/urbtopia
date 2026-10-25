import math
import os
import shutil
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "tools", "blender"))
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
    ("apple_dark", "#a82424"), ("cherry", "#b0102a"), ("cherry_dark", "#7a0c20"),
    ("leaf_green", "#5aa646"), ("leaf_silver", "#8fa36a"), ("stem_green", "#5b8a3a"),
    ("olive_green", "#7d8a2e"), ("olive_black", "#2f2a35"),
    ("flour", "#efe7d3"), ("flour_shade", "#d8ccb0"), ("sack_tie", "#b9a57a"),
    ("oil_glass", "#8fa83c"), ("oil_gold", "#d9b52c"),
    ("crust", "#c98a3e"), ("crust_dark", "#9a5c24"), ("crust_light", "#e3b062"), ("batter", "#f0d98a"),
    ("apple_slice", "#f4e6a8"), ("sugar", "#fbf6ea"),
    ("egg_cream", "#f2e6cf"), ("egg_brown", "#c9915a"), ("straw", "#e0b85a"), ("straw_dark", "#b98f38"), ("duck_shell", "#cfe6d8"),
    ("milk_white", "#fbfbf7"), ("wool", "#f6f1e8"), ("wool_shade", "#ddd3c2"), ("alpaca", "#b98a5e"), ("alpaca_light", "#e1c59f"),
    ("silk", "#f7eef5"), ("silk_shade", "#d9c3d6"), ("honey", "#e8a317"), ("honey_dark", "#b9770e"),
    ("mulberry", "#5a1f70"), ("mulberry_red", "#b02a50"),
    ("fabric_beige", "#dbc9a4"), ("fabric_beige_dark", "#bba57a"), ("fabric_alpaca", "#b4764a"), ("fabric_alpaca_dark", "#8c5430"),
    ("fabric_silk", "#b58be0"), ("fabric_silk_light", "#e6d0fb"),
    ("cheese", "#f2c94c"), ("cheese_dark", "#d6a420"), ("cheese_rind", "#c98b2f"), ("goat_white", "#f4f1ea"), ("herb", "#5d9a3c"),
    ("cream_pot", "#e9d8c0"), ("jumper_pink", "#ff8fb8"), ("jumper_pink_dark", "#d95c8c"),
    ("glove_blue", "#4a8de0"), ("glove_blue_dark", "#2d5fa8"), ("hat_red", "#d8463d"), ("hat_cream", "#f5ecd8"),
    ("scarf_violet", "#8a4dff"), ("scarf_pink", "#ff8fb8"),
]
PALETTE_NAMES = [name for name, _ in PALETTE_ENTRIES]


def color(name):
    return PALETTE_NAMES.index(name)


def build(model_id, make_parts, out_dir, budget=1500):
    """Build the parts returned by make_parts(), export <out_dir>/<model_id>/<model_id>.blend and .glb."""
    lpm.reset()
    palette = lpm.Palette([(name, hex_, 0.0, 0.7) for name, hex_ in PALETTE_ENTRIES])
    ob = lpm.finish(model_id, make_parts(), palette, budget=budget, center=False)
    asset_dir = os.path.join(out_dir, model_id)
    os.makedirs(asset_dir, exist_ok=True)
    report = lpm.export_glb(ob, os.path.join(asset_dir, model_id))
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
