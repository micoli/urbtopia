import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import item_lib  # noqa: E402
from item_lib import color, lpm  # noqa: E402


def spin(parts, deg, about):
    for part in parts:
        lpm.rotate(part, deg, "Z", about=about)
    return parts


def bricks():
    return [
        lpm.box("brick", (0.30, 0.15, 0.09), color=color("brick")),
        lpm.box("hole_a", (0.07, 0.04, 0.004), at=(-0.07, 0, 0.09), color=color("clay_dark")),
        lpm.box("hole_b", (0.07, 0.04, 0.004), at=(0.07, 0, 0.09), color=color("clay_dark")),
    ]


def can(prefix, x, y):
    return [
        lpm.prism(f"{prefix}body", 10, 0.08, 0.11, at=(x, y, 0), color=color("tin")),
        lpm.prism(f"{prefix}label", 10, 0.0815, 0.06, at=(x, y, 0.025), color=color("fish_blue")),
        lpm.prism(f"{prefix}lid", 10, 0.085, 0.012, at=(x, y, 0.11), color=color("tin_dark")),
        lpm.box(f"{prefix}tab", (0.03, 0.02, 0.006), at=(x, y, 0.122), color=color("label")),
    ]


def canned_fish():
    return can("a", 0.0, 0.0)


def cement():
    profile = [(0.10, 0), (0.15, 0.03), (0.16, 0.07), (0.12, 0.10), (0.07, 0.115)]
    sack = lpm.lathe("sack", profile, segments=8, color=color("cement"))
    lpm.paint(sack, color("cement_dark"), where=lambda c, n, i: i % 4 == 3)
    lpm.scale(sack, 1.35, 0.8, 1.0)
    random.seed(3)
    for vertex in sack.data.vertices:
        vertex.co.z += random.uniform(-0.006, 0.006)
        vertex.co.y += random.uniform(-0.008, 0.008)
    ears = []
    for side in (-1, 1):
        ear = lpm.box(f"ear{side}", (0.07, 0.11, 0.05), at=(side * 0.20, 0, 0.03), color=color("cement_dark"), taper=(0.5, 0.6))
        lpm.rotate(ear, side * 12, "Y", about=(side * 0.20, 0, 0.03))
        ears.append(ear)
    label = [
        lpm.box("label", (0.12, 0.07, 0.004), at=(0, 0, 0.114), color=color("paper")),
        lpm.box("stripe", (0.12, 0.016, 0.004), at=(0, 0, 0.118), color=color("label")),
    ]
    return [sack] + ears + label


def circuits():
    top = 0.02
    parts = [lpm.box("board", (0.34, 0.26, 0.02), color=color("pcb"))]
    parts.append(lpm.box("chip", (0.09, 0.09, 0.03), at=(-0.05, 0.02, top), color=color("chip")))
    parts.append(lpm.box("chipA", (0.06, 0.035, 0.016), at=(0.07, 0.07, top), color=color("chip")))
    parts.append(lpm.box("chipB", (0.06, 0.035, 0.016), at=(0.07, -0.01, top), color=color("chip")))
    parts.append(lpm.prism("cap", 8, 0.018, 0.045, at=(-0.12, -0.07, top), color=color("tin_dark")))
    parts.append(lpm.prism("cap2", 8, 0.014, 0.035, at=(-0.07, -0.08, top), color=color("tin_dark")))
    for i, x in enumerate((0.04, 0.08, 0.12)):
        parts.append(lpm.box(f"res{i}", (0.015, 0.04, 0.012), at=(x, -0.08, top), color=color("wood_light")))
    for i in range(6):
        parts.append(lpm.box(f"pad{i}", (0.02, 0.025, 0.004), at=(-0.12 + i * 0.048, -0.118, top), color=color("gold")))
    for i, (x, y, w, d) in enumerate([(-0.05, 0.09, 0.11, 0.01), (-0.11, 0.05, 0.01, 0.1), (0.07, 0.03, 0.01, 0.03), (0.0, -0.045, 0.14, 0.01)]):
        parts.append(lpm.box(f"trace{i}", (w, d, 0.003), at=(x, y, top), color=color("pcb_dark")))
    return parts


def crystal_shard(prefix, x, y, radius, height, tilt, axis):
    part = lpm.lathe(prefix, [(radius, 0), (radius, height * 0.6), (0.0, height)], segments=6, at=(x, y, 0), color=color("crystal"))
    lpm.paint(part, color("crystal_light"), where=lambda c, n, i: n.z > 0.35 and c.z > height * 0.62)
    lpm.rotate(part, tilt, axis, about=(x, y, 0))
    return part


def crystal():
    return [
        lpm.prism("rock", 7, 0.18, 0.04, color=color("stone_dark"), radius_top=0.16),
        crystal_shard("a", 0.0, 0.0, 0.06, 0.28, 0, "Z"),
        crystal_shard("b", 0.09, 0.03, 0.045, 0.19, 18, "Y"),
        crystal_shard("c", -0.09, 0.03, 0.05, 0.21, -20, "Y"),
        crystal_shard("d", 0.0, -0.09, 0.04, 0.14, -18, "X"),
        crystal_shard("e", 0.08, -0.08, 0.03, 0.10, -12, "X"),
    ]


def glass():
    parts = [lpm.box("tray", (0.36, 0.24, 0.03), color=color("wood"))]
    for i, y in enumerate((-0.07, 0.0, 0.07)):
        pane = lpm.box(f"pane{i}", (0.30, 0.02, 0.26), at=(0, y, 0.03), color=color("glass"))
        lpm.paint(pane, color("glass_edge"), where=lambda c, n, j: abs(n.y) < 0.5)
        parts.append(pane)
    return parts


def jewelry():
    ring = item_lib.ngon_ring("ring", 10, 0.11, 0.035, 0.05, (0, 0, 0), color("gold"))
    for part in ring:
        lpm.rotate(part, 90, "X")
        lpm.move(part, 0, 0.025, 0.1275)
    gem = lpm.lathe("gem", [(0.0, 0), (0.055, 0.035), (0.055, 0.047), (0.032, 0.08)], segments=8, at=(0, 0, 0.238), color=color("gem"))
    lpm.paint(gem, color("white"), where=lambda c, n, i: n.z > 0.9)
    return [gem] + ring


def planks():
    rng = random.Random(4)
    board = lpm.grid_box("board", (0.46, 0.13, 0.03), color=color("wood"), nx=8, nz=1)
    lpm.paint(board, color("wood_light"), where=lambda c, n, i: n.z > 0.5 and i % 3 == 0)
    lpm.paint(board, color("wood_dark"), where=lambda c, n, i: abs(n.x) > 0.9)
    for vertex in board.data.vertices:
        vertex.co.y += 0.008 * math.sin(vertex.co.x * 14) + rng.uniform(-0.004, 0.004)
        vertex.co.z += rng.uniform(-0.002, 0.002) + 0.004 * vertex.co.x
    parts = [board]
    knots = [(-0.12, 0.02, 0.026), (0.11, -0.03, 0.018), (0.02, 0.035, 0.012)]
    for i, (x, y, radius) in enumerate(knots):
        parts.append(lpm.prism(f"knot{i}", 8, radius, 0.006, at=(x, y, 0.028 + 0.004 * x), color=color("wood_dark"), radius_top=radius * 0.8))
        parts.append(lpm.prism(f"core{i}", 8, radius * 0.45, 0.008, at=(x, y, 0.028 + 0.004 * x), color=color("coal")))
    for i in range(4):
        x = rng.uniform(-0.18, 0.05)
        y = rng.uniform(-0.05, 0.05)
        parts.append(lpm.box(f"grain{i}", (rng.uniform(0.12, 0.22), 0.005, 0.004), at=(x, y, 0.029 + 0.004 * x), color=color("wood_dark")))
    return parts


def i_beam(prefix, at, rotation):
    outline = [(-0.07, 0), (0.07, 0), (0.07, 0.03), (0.015, 0.03), (0.015, 0.11), (0.07, 0.11), (0.07, 0.14),
               (-0.07, 0.14), (-0.07, 0.11), (-0.015, 0.11), (-0.015, 0.03), (-0.07, 0.03)]
    beam = lpm.sweep(prefix, outline, 0.40, at=at, color=color("steel"))
    lpm.paint(beam, color("metal"), where=lambda c, n, i: abs(n.y) > 0.5)
    lpm.rotate(beam, rotation, "Z")
    return beam


def steel():
    return [i_beam("a", (0, 0, 0), 0)]


def tile(prefix, z, deg, pattern=False):
    parts = [
        lpm.box(f"{prefix}base", (0.28, 0.28, 0.025), at=(0, 0, z), color=color("tile_cream")),
        lpm.box(f"{prefix}glaze", (0.23, 0.23, 0.004), at=(0, 0, z + 0.025), color=color("tile_blue")),
    ]
    if pattern:
        for gx in (-1, 1):
            for gy in (-1, 1):
                parts.append(lpm.box(f"{prefix}dot{gx}{gy}", (0.07, 0.07, 0.004), at=(gx * 0.055, gy * 0.055, z + 0.029), color=color("tile_cream")))
    return spin(parts, deg, (0, 0, 0))


def tiles():
    return tile("a", 0.0, 0, pattern=True)


def tools():
    wrench_outline = [(-0.18, -0.02), (0.10, -0.02), (0.10, -0.06), (0.17, -0.06), (0.17, -0.015), (0.13, -0.015),
                      (0.13, 0.015), (0.17, 0.015), (0.17, 0.06), (0.10, 0.06), (0.10, 0.02), (-0.18, 0.02)]
    wrench = [lpm.sweep("wrench", wrench_outline, 0.025, color=color("steel"), axis="z")]
    hammer_z = 0.026
    hammer = [
        lpm.box("handle", (0.34, 0.035, 0.03), at=(0, 0, hammer_z), color=color("wood")),
        lpm.box("head", (0.06, 0.11, 0.05), at=(0.14, 0, hammer_z), color=color("metal_dark")),
        lpm.box("face", (0.03, 0.12, 0.055), at=(0.185, 0, hammer_z), color=color("metal")),
        lpm.box("grip", (0.09, 0.04, 0.034), at=(-0.12, 0, hammer_z), color=color("wood_dark")),
    ]
    return spin(wrench, 28, (0, 0, 0)) + spin(hammer, -28, (0, 0, 0))


MODELS = {
    "bricks": bricks, "cannedFish": canned_fish, "cement": cement, "circuits": circuits, "crystal": crystal,
    "glass": glass, "jewelry": jewelry, "planks": planks, "steel": steel, "tiles": tiles, "tools": tools,
}

out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id, make_parts in MODELS.items():
    item_lib.build(model_id, make_parts, out_dir)
