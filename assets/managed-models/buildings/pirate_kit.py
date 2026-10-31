"""Pirate cove, Stands, Desert island and Sea forts: 1 tile = 1 unit, Z up, front at -Y, base on z = 0."""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vehicles"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".claude", "skills", "create-building-model", "scripts"))
import bpy  # noqa: E402
import building_lib  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

COLORS = [
    ("sand", "#e6cf97"), ("sand_dark", "#c9ad72"), ("grass", "#6fae54"), ("leaf", "#3f8f4a"), ("trunk", "#8a6238"),
    ("wood", "#8a5530"), ("wood_dark", "#5a331b"), ("wood_light", "#b57a45"), ("canvas", "#efe6cf"), ("red", "#b5342c"),
    ("navy", "#27406e"), ("gold", "#ffcf3a"), ("iron", "#3a3a44"), ("stone", "#a9a79f"), ("stone_dark", "#7c7a75"),
    ("stone_light", "#c6c3b9"), ("rock", "#8d8a84"), ("cliff", "#6f675c"), ("cliff_dark", "#4f4840"), ("cliff_light", "#8b8172"), ("flag", "#1b1a20"), ("rope", "#b9a57a"),
]
P = kit.palette(COLORS)

BUDGET = 9000

FONT = "SpaceGrotesk.ttf"


def start():
    lpm.reset()


def finish(name, parts, recipe):
    return tk.build(name, parts, COLORS, tk.out_dir(recipe), budget=BUDGET, fillet=0)


def sign_text(text, x, y, z, height=0.085, color="gold"):
    """Flat glyphs on a plane facing -Y, centred on x, the bottom of the letters at z."""
    vertices, polygons, width, tall, min_x, min_y = building_lib.text_outline(text, FONT, 0.015)
    scale = height / tall
    mesh = bpy.data.meshes.new("letters")
    points = [(x + (vx - min_x - width / 2) * scale, y, z + (vy - min_y) * scale) for vx, vy in vertices]
    mesh.from_pydata(points, [], polygons)
    mesh.update()
    letters = bpy.data.objects.new("letters", mesh)
    lpm._col("COL_LowPoly").objects.link(letters)
    attribute = mesh.attributes.new("lpm_color", "INT", "FACE")
    for item in attribute.data:
        item.value = int(P[color])
    return letters


def skull_flag(x, y, z, height=0.7):
    pole = lpm.prism("pole", 6, 0.018, height, at=(x, y, z), color=P["wood_dark"])
    cloth = lpm.box("flag", (0.3, 0.012, 0.18), at=(x + 0.16, y, z + height - 0.19), color=P["flag"])
    skull = lpm.box("skull", (0.07, 0.016, 0.07), at=(x + 0.16, y, z + height - 0.135), color=P["white"])
    return [pole, cloth, skull]


def barrel(x, y, z=0.0):
    return [
        lpm.prism("barrel", 8, 0.07, 0.17, at=(x, y, z), color=P["wood"], radius_top=0.065, rotate=22.5),
        lpm.prism("barrel band", 8, 0.074, 0.02, at=(x, y, z + 0.04), color=P["iron"], rotate=22.5),
        lpm.prism("barrel band", 8, 0.074, 0.02, at=(x, y, z + 0.11), color=P["iron"], rotate=22.5),
    ]


def cannon(x, y, z=0.0, angle=0.0):
    """A gun on its carriage, pointing towards -Y before the turn."""
    parts = [
        lpm.box("carriage", (0.12, 0.2, 0.05), at=(0, 0, 0), color=P["wood_dark"]),
        lpm.box("wheel", (0.15, 0.05, 0.05), at=(0, -0.06, 0), color=P["iron"]),
        lpm.box("wheel", (0.15, 0.05, 0.05), at=(0, 0.06, 0), color=P["iron"]),
        tk.cyl_y(P, "iron", 8, 0.04, -0.2, 0.09, 0.09, r_end=0.03, name="gun"),
    ]
    for part in parts:
        if angle:
            lpm.rotate(part, angle, "Z")
        lpm.move(part, x, y, z)
    return parts


def chest(x, y, z=0.0):
    return [
        lpm.box("chest", (0.2, 0.13, 0.08), at=(x, y, z), color=P["wood_dark"]),
        lpm.box("chest lid", (0.2, 0.13, 0.04), at=(x, y, z + 0.08), color=P["gold"], taper=(0.9, 0.75)),
    ]


def plank_deck(x0, x1, y0, y1, z=0.05, thickness=0.05, plank=0.2):
    """A wooden deck on posts, with its planks across x."""
    parts = []
    count = max(1, int(round((y1 - y0) / plank)))
    step = (y1 - y0) / count
    for index in range(count):
        color = "wood_light" if index % 2 == 0 else "wood"
        parts.append(lpm.box("plank", (x1 - x0, step - 0.012, thickness), at=((x0 + x1) / 2, y0 + (index + 0.5) * step, z), color=P[color]))
    return parts


def striped_awning(x, y, z, width, depth, stripes=6, front_drop=0.1):
    parts = []
    step = width / stripes
    for index in range(stripes):
        color = "red" if index % 2 == 0 else "canvas"
        cx = x - width / 2 + (index + 0.5) * step
        slab = lpm.box("awning", (step, depth, 0.025), at=(cx, y, z), color=P[color])
        for vertex in slab.data.vertices:
            vertex.co.z -= front_drop * (0.5 - (vertex.co.y - y) / depth)
        parts.append(slab)
    return parts


def wooden_shack(x, y, width, depth, height, sign=None):
    parts = [
        lpm.box("shack", (width, depth, height), at=(x, y, 0.06), color=P["wood"]),
        lpm.box("shack base", (width + 0.04, depth + 0.04, 0.05), at=(x, y, 0.06), color=P["wood_dark"]),
        lpm.box("shack roof", (width + 0.1, depth + 0.1, 0.1), at=(x, y, 0.06 + height), color=P["wood_dark"], taper=(0.82, 0.78)),
        lpm.box("door", (0.17, 0.012, 0.3), at=(x - width * 0.25, y - depth / 2 - 0.004, 0.06), color=P["wood_dark"]),
        lpm.box("hatch", (0.26, 0.012, 0.13), at=(x + width * 0.22, y - depth / 2 - 0.004, 0.2), color=P["flag"]),
    ]
    parts += striped_awning(x + width * 0.22, y - depth / 2 - 0.1, 0.38, 0.4, 0.22, stripes=4)
    return parts


def stone_tower(x, y, radius, height, sides=8, z=0.0, merlons=8, roofed=False):
    parts = [
        lpm.prism("tower", sides, radius, height, at=(x, y, z), color=P["stone"], radius_top=radius * 0.93, rotate=22.5),
        lpm.prism("tower band", sides, radius * 0.97, 0.03, at=(x, y, z + height * 0.55), color=P["stone_dark"], rotate=22.5),
        lpm.prism("tower head", sides, radius * 1.1, 0.07, at=(x, y, z + height), color=P["stone_light"], rotate=22.5),
    ]
    for index in range(merlons):
        angle = 2 * math.pi * index / merlons
        parts.append(lpm.box("merlon", (radius * 0.28, radius * 0.28, 0.07), at=(x + math.cos(angle) * radius, y + math.sin(angle) * radius, z + height + 0.07), color=P["stone_light"]))
    if roofed:
        parts.append(lpm.prism("tower roof", sides, radius * 0.92, radius * 0.9, at=(x, y, z + height + 0.07), color=P["red"], radius_top=0.01, rotate=22.5))
    return parts


def palm(x, y, z=0.0, height=0.62, lean=0.1, fronds=6):
    top = (x + lean, y, z + height)
    parts = [tk.strut(P, "trunk", (x, y, z), top, radius=0.032, sides=6)]
    for index in range(fronds):
        angle = 2 * math.pi * index / fronds
        outline = [(0.0, -0.035), (0.14, -0.05), (0.3, -0.018), (0.34, 0.0), (0.3, 0.018), (0.14, 0.05), (0.0, 0.035)]
        frond = lpm.sweep("frond", outline, 0.014, at=(0, 0, 0), color=P["leaf"], axis="z")
        for vertex in frond.data.vertices:
            vertex.co.z += 0.1 * vertex.co.x - 0.65 * vertex.co.x * vertex.co.x
        lpm.rotate(frond, math.degrees(angle), "Z")
        parts.append(lpm.move(frond, *top))
    return parts


def rock(x, y, size, z=0.0, color="rock"):
    return lpm.prism("rock", 6, size, size * 0.9, at=(x, y, z), color=P[color], radius_top=size * 0.55, rotate=(x * 97) % 60)


def rope_coil(x, y, z):
    return [
        lpm.prism("rope coil", 10, 0.1, 0.03, at=(x, y, z), color=P["rope"]),
        lpm.prism("rope coil", 10, 0.075, 0.03, at=(x, y, z + 0.03), color=P["rope"]),
        lpm.prism("rope core", 8, 0.03, 0.035, at=(x, y, z + 0.03), color=P["wood_dark"]),
    ]


def lantern(x, y, z):
    return [
        lpm.box("lantern post", (0.035, 0.035, 0.42), at=(x, y, z), color=P["wood_dark"]),
        lpm.box("lantern", (0.07, 0.07, 0.08), at=(x, y, z + 0.42), color=P["gold"]),
        lpm.box("lantern cap", (0.09, 0.09, 0.025), at=(x, y, z + 0.5), color=P["iron"]),
    ]


def crates(x, y, z):
    return [
        lpm.box("crate", (0.2, 0.2, 0.17), at=(x, y, z), color=P["wood_light"]),
        lpm.box("crate", (0.17, 0.17, 0.14), at=(x + 0.21, y + 0.03, z), color=P["wood"]),
        lpm.box("crate", (0.15, 0.15, 0.13), at=(x + 0.03, y + 0.01, z + 0.17), color=P["wood"]),
    ]


def rowboat(x, y, z):
    """A rowing boat on its trestles, hauled out on the quay, its length along x."""
    outline = [(-0.36, 0.0), (-0.22, 0.09), (0.12, 0.11), (0.33, 0.07), (0.36, 0.0), (0.33, -0.07), (0.12, -0.11), (-0.22, -0.09)]
    parts = [lpm.box("trestle", (0.04, 0.2, 0.08), at=(x + trestle, y, z), color=P["wood_dark"]) for trestle in (-0.17, 0.17)]
    parts.append(lpm.sweep("rowboat hull", outline, 0.1, at=(x, y, z + 0.08), color=P["navy"], axis="z"))
    parts.append(lpm.sweep("rowboat inside", [(px * 0.86, py * 0.74) for px, py in outline], 0.012, at=(x, y, z + 0.18), color=P["wood_light"], axis="z"))
    parts.append(lpm.box("thwart", (0.04, 0.17, 0.012), at=(x + 0.06, y, z + 0.192), color=P["wood_dark"]))
    return parts


def cove(tier, recipe, name):
    start()
    half = 1.48
    parts = [lpm.box("shore", (half * 2, half * 2, 0.05), color=P["sand"])]
    parts += plank_deck(-half, half, 0.1, half, z=0.05)
    for x in (-1.2, 0.0, 1.2):
        parts.append(lpm.prism("mooring post", 6, 0.05, 0.3, at=(x, half - 0.1, 0.05), color=P["wood_dark"]))
    parts += wooden_shack(-0.72, -0.72, 1.05, 0.72, 0.42)
    parts.append(lpm.box("sign post", (0.05, 0.05, 0.62), at=(0.4, -1.28, 0.05), color=P["wood_dark"]))
    parts.append(lpm.box("sign post", (0.05, 0.05, 0.62), at=(1.3, -1.28, 0.05), color=P["wood_dark"]))
    parts.append(lpm.box("sign board", (1.02, 0.03, 0.2), at=(0.85, -1.28, 0.5), color=P["wood_dark"]))
    parts.append(sign_text("PIRATE COVE", 0.85, -1.2975, 0.555))
    parts += barrel(1.15, -0.3, 0.05) + barrel(1.3, -0.15, 0.05) + barrel(0.95, -0.12, 0.05)
    parts += cannon(-0.9, 1.1, 0.1, 180) + cannon(0.9, 1.1, 0.1, 180)
    parts += skull_flag(0.2, -0.45, 0.05, 0.9)
    parts += rope_coil(0.25, 1.05, 0.1) + rope_coil(-0.45, 1.25, 0.1)
    for x in (-1.2, 1.2):
        parts += lantern(x, 0.18, 0.1)
    if tier == 1:
        parts += rowboat(-0.5, 0.62, 0.1) + crates(0.72, 0.5, 0.1) + barrel(0.35, 0.42, 0.1) + chest(1.1, 0.95, 0.1)
    if tier >= 2:
        parts += stone_tower(1.0, 0.52, 0.34, 0.85, z=0.1)
        parts += skull_flag(1.0, 0.52, 1.02, 0.45)
        parts += cannon(0.0, 1.1, 0.1, 180) + chest(-1.25, 0.35, 0.1) + barrel(-0.5, 0.38, 0.1)
    if tier >= 3:
        parts += stone_tower(-1.0, 0.52, 0.34, 1.15, z=0.1, roofed=True)
        parts.append(lpm.box("gate wall", (1.32, 0.16, 0.6), at=(0.0, 0.52, 0.1), color=P["stone"]))
        parts.append(lpm.box("gate", (0.34, 0.03, 0.42), at=(0.0, 0.43, 0.1), color=P["wood_dark"]))
        for x in (-0.5, -0.25, 0.25, 0.5):
            parts.append(lpm.box("merlon", (0.12, 0.16, 0.08), at=(x, 0.52, 0.7), color=P["stone_light"]))
        parts += chest(-0.2, 0.2, 0.1) + chest(0.25, 0.22, 0.1)
    return finish(name, parts, recipe)


def stands(width, depth, rows, recipe, name, canopy=False):
    """Rows rising away from the water, the lowest at the front; figures sit on the slope 0.04 to 0.54."""
    start()
    half_w, half_d = width / 2 - 0.02, depth / 2 - 0.02
    parts = [lpm.box("floor", (half_w * 2, half_d * 2, 0.04), color=P["stone_dark"])]
    step = (half_d * 2) / rows
    for row in range(rows):
        y0 = -half_d + row * step
        top = 0.04 + (row + 1) / rows * 0.5
        parts.append(lpm.box("step", (half_w * 2 - 0.1, step, top - 0.02), at=(0, y0 + step / 2, 0.02), color=P["wood"]))
        parts.append(lpm.box("seat", (half_w * 2 - 0.14, step * 0.5, 0.025), at=(0, y0 + step * 0.32, top), color=P["navy" if row % 2 else "red"]))
    for side in (-1, 1):
        wall = lpm.sweep("side wall", [(-half_d, 0.02), (half_d, 0.02), (half_d, 0.62), (-half_d, 0.12)], 0.05, at=(0, 0, 0), color=P["wood_dark"], axis="y")
        lpm.rotate(wall, 90, "Z")
        parts.append(lpm.move(wall, side * (half_w - 0.025), 0, 0))
    parts.append(lpm.box("back wall", (half_w * 2, 0.05, 0.75), at=(0, half_d - 0.025, 0.02), color=P["wood_dark"]))
    count = max(2, int(width))
    for index in range(count):
        x = -half_w + (index + 0.5) * (half_w * 2) / count
        parts.append(lpm.box("pennant pole", (0.018, 0.018, 0.28), at=(x, half_d - 0.025, 0.75), color=P["wood_dark"]))
        pennant = lpm.sweep("pennant", [(0, 0), (0.15, 0.05), (0, 0.1)], 0.01, at=(x, half_d - 0.025, 0.91), color=P["red" if index % 2 else "gold"], axis="y")
        parts.append(pennant)
    if canopy:
        depth_canopy = half_d * 0.42
        y = half_d - depth_canopy / 2
        for x in (-half_w + 0.05, 0.0, half_w - 0.05):
            parts.append(lpm.box("canopy post", (0.05, 0.05, 1.2), at=(x, half_d - 0.06, 0.04), color=P["wood_dark"]))
        parts += striped_awning(0, y, 1.24, half_w * 2, depth_canopy, stripes=int(width) * 2, front_drop=0.0)
    return finish(name, parts, recipe)


def castaway_hut(x, y, z):
    """A lean-to of branches under a roof of palm leaves, open towards -Y."""
    parts = []
    for px, py, tall in ((-0.2, -0.16, 0.3), (0.2, -0.16, 0.3), (-0.2, 0.16, 0.18), (0.2, 0.16, 0.18)):
        parts.append(lpm.box("hut post", (0.03, 0.03, tall), at=(x + px, y + py, z), color=P["trunk"]))
    roof = lpm.box("hut roof", (0.54, 0.44, 0.035), at=(x, y, z + 0.235), color=P["leaf"])
    lpm.rotate(roof, -19, "X", about=(x, y, z + 0.24))
    parts.append(roof)
    parts.append(lpm.box("hut wall", (0.4, 0.02, 0.17), at=(x, y + 0.16, z), color=P["wood_light"]))
    return parts


def campfire(x, y, z):
    parts = [lpm.prism("fire stones", 8, 0.075, 0.025, at=(x, y, z), color=P["stone_dark"])]
    for angle in (25, 145, 265):
        log = lpm.box("log", (0.12, 0.022, 0.022), at=(0, 0, 0), color=P["wood_dark"])
        lpm.rotate(log, angle, "Z")
        parts.append(lpm.move(log, x, y, z + 0.025))
    parts.append(lpm.prism("flame", 6, 0.04, 0.1, at=(x, y, z + 0.035), color=P["gold"], radius_top=0.005))
    return parts


def shipwreck(x, y, z):
    """The stern half of a wrecked ship stranded on the beach, listing, its mast snapped."""
    outline = [(-0.17, -0.42), (0.17, -0.42), (0.2, -0.05), (0.15, 0.32), (0.0, 0.5), (-0.15, 0.32), (-0.2, -0.05)]
    pieces = [
        lpm.sweep("wreck hull", [(px * 0.78, py * 0.92) for px, py in outline], 0.1, at=(0, 0, 0), color=P["wood_dark"], axis="z"),
        lpm.sweep("wreck side", outline, 0.13, at=(0, 0, 0.1), color=P["wood"], axis="z"),
        lpm.sweep("wreck deck", [(px * 0.85, py * 0.9) for px, py in outline], 0.012, at=(0, 0, 0.222), color=P["wood_light"], axis="z"),
        lpm.prism("broken mast", 6, 0.03, 0.42, at=(0, -0.08, 0.22), color=P["wood_dark"], radius_top=0.02),
        lpm.box("broken yard", (0.42, 0.024, 0.024), at=(0.02, -0.08, 0.46), color=P["wood_dark"]),
        lpm.box("torn sail", (0.2, 0.014, 0.16), at=(0.1, -0.09, 0.3), color=P["canvas"]),
    ]
    for rib_x in (-0.1, 0.0, 0.1):
        pieces.append(lpm.box("rib", (0.024, 0.024, 0.13), at=(rib_x, -0.44, 0.1), color=P["wood_dark"]))
    for piece in pieces:
        lpm.rotate(piece, 14, "Y")
        lpm.rotate(piece, 32, "Z")
        lpm.move(piece, x, y, z - 0.02)
    return pieces


def island(tier, recipe, name):
    """A Desert island grows: more beach and palms at Tier 2 with a castaway's camp, then a rocky hill and a shipwreck at Tier 3."""
    start()
    half_w, half_d = {1: (0.98, 0.98), 2: (0.98, 1.48), 3: (1.48, 1.48)}[tier]
    outline = rock_outline(half_w, half_d, 2.2 + tier)
    parts = [
        lpm.sweep("beach", outline, 0.08, at=(0, 0, 0), color=P["sand_dark"], axis="z"),
        lpm.sweep("beach top", [(x * 0.92, y * 0.92) for x, y in outline], 0.06, at=(0, 0, 0.08), color=P["sand"], axis="z"),
    ]
    lawn_y = 0.15 if tier == 1 else 0.3
    parts.append(lpm.sweep("lawn", [(x * 0.52 - 0.12, y * 0.52 + lawn_y) for x, y in outline], 0.03, at=(0, 0, 0.14), color=P["grass"], axis="z"))
    if tier == 1:
        parts += palm(-0.3, 0.3, 0.14, height=0.78, lean=0.16) + palm(0.05, 0.42, 0.14, height=0.58, lean=-0.1, fronds=5) + palm(-0.45, -0.02, 0.14, height=0.5, lean=-0.08, fronds=5)
        parts += [rock(0.62, 0.3, 0.13, 0.08), rock(0.62, 0.05, 0.08, 0.08), rock(-0.62, -0.4, 0.09, 0.08)]
        parts += chest(0.32, -0.42, 0.14)
        parts.append(lpm.box("cross", (0.05, 0.02, 0.2), at=(-0.05, -0.5, 0.14), color=P["wood_dark"]))
        parts.append(lpm.box("cross", (0.15, 0.02, 0.04), at=(-0.05, -0.5, 0.26), color=P["wood_dark"]))
    if tier == 2:
        parts += palm(-0.4, 0.85, 0.14, height=0.82, lean=0.15) + palm(0.1, 0.95, 0.14, height=0.62, lean=-0.1, fronds=5) + palm(-0.5, 0.25, 0.14, height=0.6, lean=-0.1, fronds=5) + palm(0.3, 0.32, 0.14, height=0.72, lean=0.1)
        parts += castaway_hut(-0.1, -0.3, 0.14) + campfire(0.3, -0.72, 0.14) + chest(-0.42, -0.85, 0.14)
        parts.append(lpm.box("log seat", (0.2, 0.05, 0.05), at=(0.0, -0.8, 0.14), color=P["trunk"]))
        parts += [rock(0.65, 0.75, 0.13, 0.08), rock(0.62, 0.5, 0.08, 0.08), rock(-0.62, -0.55, 0.09, 0.08)]
    if tier == 3:
        hill = [(0.0, 0.42, 0.5, "stone_dark"), (0.32, 0.3, 0.38, "rock"), (0.58, 0.22, 0.26, "stone")]
        for level, tall, radius, color in hill:
            parts.append(lpm.prism("hill", 9, radius * 1.5, tall, at=(-0.35, 0.62, 0.15 + level), color=P[color], radius_top=radius * 1.05, rotate=level * 40))
        parts.append(lpm.prism("hilltop", 9, 0.33, 0.04, at=(-0.35, 0.62, 0.95), color=P["grass"], radius_top=0.27))
        parts += palm(-0.35, 0.62, 0.99, height=0.5, lean=0.08, fronds=5)
        parts += palm(0.55, 0.85, 0.14, height=0.85, lean=-0.14) + palm(0.95, 0.4, 0.14, height=0.68, lean=0.1, fronds=5) + palm(0.3, 0.3, 0.14, height=0.6, lean=-0.1, fronds=5) + palm(-1.05, 0.05, 0.14, height=0.62, lean=0.1, fronds=5)
        parts += castaway_hut(-0.45, -0.28, 0.14) + campfire(-0.1, -0.62, 0.14)
        parts += shipwreck(0.72, -0.62, 0.14)
        parts += chest(-0.72, -0.9, 0.14) + chest(-0.48, -0.98, 0.14)
        parts.append(lpm.prism("gold heap", 7, 0.12, 0.07, at=(-0.6, -0.78, 0.14), color=P["gold"], radius_top=0.02))
        parts += [rock(1.08, -0.1, 0.13, 0.08), rock(-1.0, -0.62, 0.1, 0.08), rock(0.0, -1.12, 0.09, 0.08), rock(0.9, 0.85, 0.1, 0.08)]
    return finish(name, parts, recipe)


def rock_outline(half_w, half_d, seed, points=18, power=3, rough=0.12):
    """A rough rounded rectangle, the same for the same seed, touching at most half_w and half_d."""
    outline = []
    for index in range(points):
        angle = 2 * math.pi * index / points
        cos, sin = math.cos(angle), math.sin(angle)
        radius = (abs(cos / half_w) ** power + abs(sin / half_d) ** power) ** (-1 / power)
        bump = 1 - rough + rough * ((math.sin(seed + index * 2.4) + math.sin(seed * 1.7 + index * 5.1)) / 4 + 0.5)
        outline.append((cos * radius * bump, sin * radius * bump))
    return outline


def crag_top(part, top, spread, seed):
    """Breaks up the flat top of a band of rock, the same for the same seed."""
    for vertex in part.data.vertices:
        if vertex.co.z > top - 0.001:
            vertex.co.z += spread * math.sin(seed + vertex.co.x * 7.3) * math.cos(seed * 0.7 + vertex.co.y * 5.9)
    part.data.update()
    return part


def rocky_islet(half_w, half_d, top):
    """A crag rising from the water to a plateau at z = top, boulders heaped against its foot."""
    bands = [(0.0, 0.34, 1.0, "cliff_dark", 1.3), (0.34, 0.62, 0.95, "cliff", 2.9), (0.62, 0.84, 0.91, "cliff_light", 4.2), (0.84, 1.0, 0.875, "cliff", 5.6)]
    parts = []
    for start_k, end_k, inset, color, seed in bands:
        z0, z1 = top * start_k, top * end_k
        # The last band is the plateau the fort stands on: nearly even, so no wall hangs over its edge.
        outline = rock_outline(half_w * inset, half_d * inset, seed, power=5, rough=0.12 if end_k < 1.0 else 0.03)
        band = lpm.sweep("rock band", outline, z1 - z0 + 0.02, at=(0, 0, z0), color=P[color], axis="z")
        lpm.taper(band, 0.95, z0, z1)
        parts.append(crag_top(band, z1 + 0.02, 0.018, seed) if end_k < 1.0 else band)
    count = int((half_w + half_d) * 6)
    for index in range(count):
        angle = 2 * math.pi * index / count + 0.3
        cos, sin = math.cos(angle), math.sin(angle)
        radius = (abs(cos / half_w) ** 5 + abs(sin / half_d) ** 5) ** (-1 / 5)
        size = 0.1 + 0.07 * ((index * 7) % 3) / 2
        reach = 0.84 - 0.05 * (index % 3 == 0)
        base = 0.0 if index % 3 else top * 0.3
        color = ("cliff_dark", "cliff", "cliff_light")[index % 3]
        parts.append(rock(cos * radius * reach, sin * radius * reach, size, base, color))
    return parts


def keep_tower(top):
    """A two-stage keep with a door up a stair, arrow slits and roofed corner turrets."""
    base, upper = 0.5, 0.36
    parts = [
        lpm.box("keep", (0.74, 0.64, base), at=(0, 0.05, top), color=P["stone_light"], taper=(0.96, 0.96)),
        lpm.box("keep course", (0.76, 0.66, 0.035), at=(0, 0.05, top + base), color=P["stone_dark"]),
        lpm.box("keep upper", (0.54, 0.46, upper), at=(0, 0.05, top + base + 0.035), color=P["stone_light"]),
        lpm.box("keep roof", (0.6, 0.52, 0.2), at=(0, 0.05, top + base + 0.035 + upper), color=P["red"], taper=(0.25, 0.25)),
        lpm.box("keep door", (0.15, 0.02, 0.24), at=(0, -0.275, top), color=P["wood_dark"]),
        lpm.box("keep lintel", (0.2, 0.025, 0.035), at=(0, -0.275, top + 0.24), color=P["stone_dark"]),
    ]
    for step in range(3):
        parts.append(lpm.box("keep step", (0.24, 0.06, 0.03 * (3 - step)), at=(0, -0.3 - step * 0.05, top), color=P["stone_dark"]))
    for x in (-0.22, 0.22):
        parts.append(lpm.box("arrow slit", (0.035, 0.012, 0.15), at=(x, -0.272, top + 0.27), color=P["flag"]))
    for x in (-0.15, 0.15):
        parts.append(lpm.box("arrow slit", (0.035, 0.012, 0.13), at=(x, -0.182, top + base + 0.15), color=P["flag"]))
    for side in (-1, 1):
        for y in (-0.05, 0.15):
            parts.append(lpm.box("arrow slit", (0.012, 0.035, 0.15), at=(side * 0.372, y + 0.05, top + 0.27), color=P["flag"]))
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * 0.36, 0.05 + sy * 0.31
            parts.append(lpm.prism("turret", 8, 0.075, 0.68, at=(x, y, top), color=P["stone"], rotate=22.5))
            parts.append(lpm.prism("turret roof", 8, 0.1, 0.2, at=(x, y, top + 0.68), color=P["red"], radius_top=0.008, rotate=22.5))
    parts += skull_flag(0, 0.05, top + base + upper + 0.2, 0.38)
    return parts


def cannonballs(x, y, z, radius=0.028):
    """A stack of shot: three layers, nine, four, then one."""
    parts = []
    step = radius * 2.05
    for layer, count in enumerate((3, 2, 1)):
        for row in range(count):
            for column in range(count):
                cx = x + (column - (count - 1) / 2) * step
                cy = y + (row - (count - 1) / 2) * step
                profile = [(0, 0), (radius * 0.7, radius * 0.3), (radius, radius), (radius * 0.7, radius * 1.7), (0, radius * 2)]
                parts.append(lpm.lathe("cannonball", profile, segments=6, at=(cx, cy, z + layer * radius * 1.45), color=P["iron"]))
    return parts


def table_and_chairs(x, y, z):
    top = 0.095
    parts = [lpm.box("table top", (0.24, 0.14, 0.016), at=(x, y, z + top), color=P["wood_light"])]
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(lpm.box("table leg", (0.016, 0.016, top), at=(x + sx * 0.1, y + sy * 0.05, z), color=P["wood_dark"]))
    for sx, sy, back_x, back_y in ((-0.07, -0.13, 0, -0.022), (0.07, -0.13, 0, -0.022), (-0.07, 0.13, 0, 0.022), (0.07, 0.13, 0, 0.022), (-0.18, 0, -0.022, 0), (0.18, 0, 0.022, 0)):
        cx, cy = x + sx, y + sy
        parts.append(lpm.box("chair", (0.05, 0.05, 0.055), at=(cx, cy, z), color=P["wood"]))
        size = (0.05, 0.01, 0.06) if back_y else (0.01, 0.05, 0.06)
        parts.append(lpm.box("chair back", size, at=(cx + back_x, cy + back_y, z + 0.055), color=P["wood_dark"]))
    parts += [lpm.box("mug", (0.018, 0.018, 0.02), at=(x + dx, y, z + top + 0.016), color=P["gold"]) for dx in (-0.06, 0.05)]
    return parts


def courtyard_stores(inner_w, inner_d, z):
    """Shot, barrels and tables along the walls of the courtyard, clear of the gate and the keep."""
    near_x, near_y = inner_w - 0.27, inner_d - 0.3
    # A table with its chairs reaches further than the other stores: it keeps clear of the walls and corner towers.
    parts = table_and_chairs(-(inner_w - 0.42), -(inner_d - 0.5), z)
    parts += cannonballs(near_x + 0.02, -near_y - 0.02, z)
    parts += barrel(near_x - 0.2, -near_y + 0.03, z) + barrel(near_x - 0.2, -near_y - 0.13, z)
    parts += barrel(-near_x + 0.02, near_y, z) + barrel(-near_x + 0.17, near_y + 0.03, z) + barrel(-near_x + 0.09, near_y - 0.14, z)
    parts += cannonballs(near_x, near_y, z)
    if inner_w > 1.0:
        parts += table_and_chairs(inner_w - 0.35, 0.0, z) + cannonballs(-near_x, 0.1, z) + barrel(-near_x + 0.02, -0.15, z)
    if inner_d > 1.0:
        parts += table_and_chairs(0.0, inner_d - 0.3, z)
    return parts


def fort(width, depth, recipe, name, keep=True):
    """A walled fort on its rocky islet: the rock takes the edge of the footprint, the walls stand inside it."""
    start()
    half_w, half_d = width / 2 - 0.02, depth / 2 - 0.02
    top = 0.44
    wall = 0.17
    height = 0.5
    tower = 0.25
    parts = rocky_islet(half_w, half_d, top)
    inner_w, inner_d = half_w * 0.78 - tower * 1.12, half_d * 0.78 - tower * 1.12
    # Walls and towers start inside the rock, so they rest on it wherever it dips.
    footing = 0.14
    base = top - footing
    parts.append(lpm.box("courtyard", (inner_w * 2, inner_d * 2, 0.03), at=(0, 0, top), color=P["sand_dark"]))
    runs = [(0, -inner_d, inner_w * 2, wall), (0, inner_d, inner_w * 2, wall), (-inner_w, 0, wall, inner_d * 2), (inner_w, 0, wall, inner_d * 2)]
    for x, y, sx, sy in runs:
        parts.append(lpm.box("wall", (sx, sy, height + footing), at=(x, y, base), color=P["stone"]))
        parts.append(lpm.box("wall cap", (sx + 0.03, sy + 0.03, 0.03), at=(x, y, top + height), color=P["stone_light"]))
    along = max(4, int(width * 2))
    for index in range(along + 1):
        x = -inner_w + index * (inner_w * 2) / along
        for y in (-inner_d, inner_d):
            parts.append(lpm.box("merlon", (0.09, wall * 0.75, 0.07), at=(x, y, top + height + 0.03), color=P["stone_light"]))
    across = max(4, int(depth * 2))
    for index in range(1, across):
        y = -inner_d + index * (inner_d * 2) / across
        for x in (-inner_w, inner_w):
            parts.append(lpm.box("merlon", (wall * 0.75, 0.09, 0.07), at=(x, y, top + height + 0.03), color=P["stone_light"]))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts += stone_tower(sx * inner_w, sy * inner_d, tower, 0.75 + footing, z=base, merlons=6)
    parts.append(lpm.box("gate", (0.27, 0.025, 0.36), at=(0, -inner_d - wall / 2 - 0.006, top), color=P["wood_dark"]))
    parts.append(lpm.box("gate arch", (0.34, 0.03, 0.05), at=(0, -inner_d - wall / 2 - 0.002, top + 0.36), color=P["stone_dark"]))
    stairs = int((half_d * 0.97 - inner_d - wall / 2 - 0.05) / 0.07)
    for step in range(stairs):
        parts.append(lpm.box("stair", (0.3, 0.08, top * (stairs - step) / stairs), at=(0, -inner_d - wall / 2 - 0.05 - step * 0.07, 0.0), color=P["stone_dark"]))
    for x in (-0.5, 0.5):
        parts += cannon(x * inner_w, -inner_d, top + height + 0.03, 0)
        parts += cannon(x * inner_w, inner_d, top + height + 0.03, 180)
    if keep:
        parts += keep_tower(top + 0.03)
        parts += courtyard_stores(inner_w, inner_d, top + 0.03)
    else:
        parts += skull_flag(0, 0, top + 0.03, 1.0)
        parts += barrel(0.26, 0.24, top + 0.03) + barrel(-0.26, 0.14, top + 0.03) + chest(0.0, -0.2, top + 0.03)
    return finish(name, parts, recipe)
