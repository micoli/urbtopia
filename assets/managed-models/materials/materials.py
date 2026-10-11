import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import item_lib  # noqa: E402
from item_lib import color, lpm  # noqa: E402


def bar(name, sides, radius, length, x, z, body, ends):
    part = lpm.prism(name, sides, radius, length, color=color(body))
    lpm.paint(part, color(ends), where=lambda c, n, i: abs(n.y) > 0.5)
    lpm.rotate(part, 90, "X")
    lpm.move(part, x, length / 2, z)
    return part


def lump(name, size, at, deg, body, taper=(0.7, 0.7)):
    part = lpm.box(name, size, at=at, color=color(body), taper=taper)
    lpm.rotate(part, deg, "Z", about=(at[0], at[1], 0))
    return part


def clay():
    profile = [(0.10, 0), (0.13, 0.02), (0.14, 0.06), (0.12, 0.10), (0.07, 0.125), (0.0, 0.135)]
    loaf = lpm.lathe("loaf", profile, segments=9, color=color("clay"))
    lpm.paint(loaf, color("clay_dark"), where=lambda c, n, i: i % 5 == 2)
    lpm.scale(loaf, 1.5, 1.0, 1.0)
    jitter(loaf, 0.012, 5, 0.01)
    lpm.rotate(loaf, 12, "Z")
    return [loaf]


def coal():
    return [
        lump("a", (0.16, 0.14, 0.10), (0, 0, 0), 20, "coal"),
        lump("d", (0.10, 0.10, 0.08), (0.02, 0.0, 0.10), 50, "coal_shine"),
    ]


def fish_parts(prefix, y, scale, body, belly):
    def outline(points):
        return [(px * scale, pz * scale) for px, pz in points]

    depth = 0.06 * scale
    return [
        lpm.sweep(f"{prefix}body", outline([(0.18, 0.10), (0.08, 0.17), (-0.04, 0.17), (-0.12, 0.115), (-0.12, 0.085), (-0.04, 0.03), (0.08, 0.03)]), depth, at=(0, y, 0), color=color(body)),
        lpm.sweep(f"{prefix}belly", outline([(0.14, 0.07), (0.08, 0.03), (-0.04, 0.03), (-0.09, 0.08), (0.02, 0.08)]), depth * 1.02, at=(0, y, 0), color=color(belly)),
        lpm.sweep(f"{prefix}tail", outline([(-0.10, 0.10), (-0.20, 0.17), (-0.17, 0.10), (-0.20, 0.03)]), depth * 0.5, at=(0, y, 0), color=color(body)),
        lpm.sweep(f"{prefix}fin", outline([(0.01, 0.17), (-0.03, 0.22), (-0.07, 0.17)]), depth * 0.5, at=(0, y, 0), color=color(body)),
        lpm.box(f"{prefix}eye", (0.025 * scale, 0.012, 0.025 * scale), at=(0.12 * scale, y - depth / 2 - 0.004, 0.105 * scale), color=color("coal")),
    ]


def fish():
    return fish_parts("a", 0.0, 1.0, "fish_blue", "fish_belly")


def gold():
    parts = []
    rows = [(0.0, [0.0])]
    for row, (z, xs) in enumerate(rows):
        for i, x in enumerate(xs):
            body = "gold" if (row + i) % 2 == 0 else "gold_dark"
            if row == 2:
                body = "gold"
            parts.append(lpm.box(f"ingot{row}{i}", (0.13, 0.08, 0.05), at=(x, 0, z), color=color(body), taper=(0.8, 0.75)))
    return parts


def metal():
    parts = []
    rows = [(0.035, [0.0])]
    for row, (z, xs) in enumerate(rows):
        for i, x in enumerate(xs):
            parts.append(bar(f"bar{row}{i}", 6, 0.035, 0.34, x, z, "steel", "tin"))
    return parts


def sand():
    return [
        lpm.lathe("big", [(0.20, 0), (0.15, 0.04), (0.08, 0.09), (0, 0.14)], segments=8, color=color("sand")),
    ]


def silicon():
    parts = []
    parts.append(lpm.prism("wafer", 12, 0.16, 0.025, color=color("silicon")))
    top = 0.025
    for gx in (-1, 0, 1):
        for gy in (-1, 0, 1):
            parts.append(lpm.box(f"die{gx}{gy}", (0.045, 0.045, 0.006), at=(gx * 0.06, gy * 0.06, top), color=color("silicon_light")))
    return parts


def jitter(part, amount, seed, lift=0.0):
    rng = random.Random(seed)
    for vertex in part.data.vertices:
        vertex.co.x += rng.uniform(-amount, amount)
        vertex.co.y += rng.uniform(-amount, amount)
        vertex.co.z += rng.uniform(-lift, lift)
    return part


def stone():
    profile = [(0.13, 0), (0.17, 0.04), (0.16, 0.10), (0.11, 0.15), (0.05, 0.18)]
    rock = lpm.lathe("rock", profile, segments=7, color=color("stone"))
    lpm.paint(rock, color("stone_dark"), where=lambda c, n, i: i % 3 == 1)
    lpm.paint(rock, color("stone"), where=lambda c, n, i: n.z > 0.8)
    jitter(rock, 0.02, 11, 0.012)
    return [rock]


def wood():
    profile = [(0.040, 0), (0.058, 0.03), (0.050, 0.10), (0.063, 0.18), (0.054, 0.26), (0.044, 0.31)]
    log = lpm.lathe("log", profile, segments=8, color=color("wood"))
    lpm.paint(log, color("wood_dark"), where=lambda c, n, i: i % 4 == 0)
    lpm.paint(log, color("wood_light"), where=lambda c, n, i: abs(n.z) > 0.8)
    jitter(log, 0.006, 7)
    lpm.rotate(log, 22.5, "Z")
    branch = lpm.prism("branch", 6, 0.024, 0.07, at=(0.045, 0, 0.17), color=color("wood_dark"), radius_top=0.018)
    lpm.paint(branch, color("wood_light"), where=lambda c, n, i: n.z > 0.8)
    lpm.rotate(branch, 65, "Y", about=(0.045, 0, 0.17))
    parts = [log, branch]
    for part in parts:
        lpm.rotate(part, 90, "X")
        lpm.rotate(part, 14, "Z")
        lpm.move(part, 0, 0.155, 0)
    return parts


MODELS = {
    "clay": clay, "coal": coal, "fish": fish, "gold": gold, "metal": metal,
    "sand": sand, "silicon": silicon, "stone": stone, "wood": wood,
}

out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id, make_parts in MODELS.items():
    item_lib.build(model_id, make_parts, out_dir)
