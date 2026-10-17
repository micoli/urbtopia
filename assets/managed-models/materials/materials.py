import math
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


def stick(name, start, end, radius, body):
    dx, dy, dz = (end[i] - start[i] for i in range(3))
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    part = lpm.prism(name, 4, radius, length, color=color(body))
    lpm.rotate(part, math.degrees(math.acos(dz / length)), "Y")
    lpm.rotate(part, math.degrees(math.atan2(dy, dx)), "Z")
    lpm.move(part, *start)
    return part


def leaf(name, at, yaw, length, width, body):
    outline = [(0, 0), (length * 0.4, width / 2), (length, 0), (length * 0.4, -width / 2)]
    part = lpm.sweep(name, outline, 0.004, at=at, color=color(body), axis="z")
    lpm.rotate(part, yaw, "Z", about=at)
    return part


def fruit(name, radius, at, body, shade, segments):
    profile = [(0, 0), (radius * 0.7, radius * 0.1), (radius, radius * 0.7), (radius * 0.9, radius * 1.4), (radius * 0.5, radius * 1.85), (0, radius * 1.7)]
    part = lpm.lathe(name, profile, segments=segments, at=at, color=color(body))
    lpm.paint(part, color(shade), where=lambda c, n, i: i % 4 == 1)
    return part


def apple():
    body = fruit("apple", 0.085, (0, 0, 0), "red", "apple_dark", 8)
    return [
        body,
        lpm.prism("stem", 4, 0.01, 0.05, at=(0, 0, 0.13), color=color("wood_dark"), radius_top=0.008),
        leaf("leaf", (0.008, 0, 0.17), 20, 0.07, 0.035, "leaf_green"),
    ]


def cherry():
    joint = (0, 0, 0.30)
    parts = [
        stick("stem_a", (-0.07, 0, 0.115), joint, 0.007, "stem_green"),
        stick("stem_b", (0.07, 0, 0.115), joint, 0.007, "stem_green"),
        leaf("leaf", (0, 0, 0.30), 10, 0.10, 0.045, "leaf_green"),
    ]
    for side, body in ((-1, "cherry"), (1, "cherry_dark")):
        parts.append(fruit(f"cherry{side}", 0.058, (side * 0.07, 0, 0), body, "cherry_dark" if side < 0 else "cherry", 7))
    return parts


def olive():
    nodes = [(-0.20, 0.0, 0.05), (-0.10, 0.02, 0.07), (0.0, 0.03, 0.09), (0.10, 0.02, 0.10), (0.20, 0.0, 0.12)]
    parts = [stick(f"twig{i}", a, b, 0.012 - 0.002 * i, "wood_dark") for i, (a, b) in enumerate(zip(nodes, nodes[1:]))]
    for i, node in enumerate(nodes[1:], start=1):
        for side in (-1, 1):
            parts.append(leaf(f"leaf{i}_{side}", node, 90 + side * 50, 0.11, 0.028, "leaf_silver"))
    for i, (node, body) in enumerate(((nodes[1], "olive_green"), (nodes[2], "olive_black"), (nodes[3], "olive_green"))):
        hang = (node[0], node[1] + 0.01, node[2] - 0.07)
        parts.append(stick(f"olive_stem{i}", node, hang, 0.005, "stem_green"))
        parts.append(lpm.lathe(f"olive{i}", [(0, -0.05), (0.03, -0.03), (0.034, 0.0), (0.028, 0.03), (0, 0.045)], segments=6, at=(hang[0], hang[1], hang[2] - 0.045), color=color(body)))
    return parts


def sack(name, at, yaw, scale):
    x, y, z = at
    body = lpm.box(f"{name}_body", (0.20, 0.13, 0.17), at=(0, 0, 0), color=color("flour"), taper=(0.78, 0.82))
    lpm.paint(body, color("flour_shade"), where=lambda c, n, i: n.x > 0.5 or n.y > 0.5)
    shoulder = lpm.box(f"{name}_shoulder", (0.15, 0.10, 0.04), at=(0, 0, 0.17), color=color("flour"), taper=(0.55, 0.6))
    neck = lpm.box(f"{name}_neck", (0.07, 0.055, 0.04), at=(0, 0, 0.21), color=color("flour_shade"), taper=(1.2, 1.2))
    tie = lpm.box(f"{name}_tie", (0.08, 0.065, 0.015), at=(0, 0, 0.215), color=color("sack_tie"))
    stripe = lpm.box(f"{name}_stripe", (0.13, 0.006, 0.045), at=(0, -0.0675, 0.07), color=color("label"))
    parts = [body, shoulder, neck, tie, stripe]
    for part in parts:
        lpm.scale(part, scale, scale, scale)
        lpm.rotate(part, yaw, "Z")
        lpm.move(part, x, y, z)
    return parts


def flour():
    return sack("big", (-0.07, 0.03, 0), 12, 1.0) + sack("small", (0.13, -0.07, 0), -25, 0.62)


def bottle(name, at, scale):
    x, y, z = at
    profile = [(0, 0), (0.052, 0), (0.060, 0.02), (0.060, 0.13), (0.045, 0.17), (0.022, 0.20), (0.020, 0.25), (0, 0.25)]
    body = lpm.lathe(f"{name}_body", profile, segments=8, color=color("oil_glass"))
    lpm.paint(body, color("oil_gold"), where=lambda c, n, i: c.z < 0.15 and abs(n.z) < 0.5 and i % 2 == 0)
    label = lpm.prism(f"{name}_label", 8, 0.0615, 0.055, at=(0, 0, 0.045), color=color("paper"))
    cap = lpm.prism(f"{name}_cap", 6, 0.026, 0.032, at=(0, 0, 0.248), color=color("olive_black"))
    parts = [body, label, cap]
    for part in parts:
        lpm.scale(part, scale, scale, scale)
        lpm.move(part, x, y, z)
    return parts


def olive_oil():
    return bottle("big", (-0.05, 0.02, 0), 1.0) + bottle("small", (0.11, -0.05, 0), 0.7)


MODELS = {
    "clay": clay, "coal": coal, "fish": fish, "gold": gold, "metal": metal,
    "sand": sand, "silicon": silicon, "stone": stone, "wood": wood,
    "apple": apple, "cherry": cherry, "olive": olive,
    "flour": flour, "olive-oil": olive_oil,
}

out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id, make_parts in MODELS.items():
    item_lib.build(model_id, make_parts, out_dir)
