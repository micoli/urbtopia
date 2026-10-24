import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("leaf", "#3f8a3a", 0.0, 0.9), ("leaf_dark", "#2f6f33", 0.0, 0.9), ("leaf_light", "#5aa046", 0.0, 0.9),
    ("leaf_gold", "#9aa83c", 0.0, 0.9), ("trunk", "#7a5232", 0.0, 0.9), ("trunk_dark", "#5e3f26", 0.0, 0.9),
    ("fruit", "#f5901e", 0.0, 0.6), ("fruit_dark", "#d9720f", 0.0, 0.6), ("fruit_light", "#ffb04a", 0.0, 0.6),
    ("blossom", "#ffe6ee", 0.0, 0.8), ("stem", "#6b4a2a", 0.0, 0.9),
])


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def blob(rng, name, at, radius, colors=("leaf", "leaf_light", "leaf_dark")):
    x, y, z = at
    profile = [(0.005, 0), (radius * 0.8, radius * 0.15), (radius, radius * 0.5), (radius * 0.8, radius * 0.85), (radius * 0.3, radius * 1.05), (0.005, radius * 1.1)]
    ob = lpm.lathe(name, profile, segments=6, at=(x, y, z), color=P[colors[0]])
    lpm.paint(ob, P[colors[1]], lambda c, n, i: n.z > 0.45)
    lpm.paint(ob, P[colors[2]], lambda c, n, i: n.z < 0.0)
    lpm.rotate(ob, rng.uniform(0, 60), "Z", about=(x, y, z))
    return ob


def round_profile(radius, angles, squash=0.96, dimple=0.0):
    """Lathe profile of a ball standing on the ground, from the bottom pole to the top; `dimple` sinks the top."""
    points = [(max(0.005, radius * math.cos(math.radians(a))), radius * squash * (1 + math.sin(math.radians(a)))) for a in angles]
    points[-1] = (0.005, points[-1][1] - dimple)
    return points


def orange(name, at, size, rng, simple=False):
    """A round orange; `simple` drops the dimple and the stem for fruit hanging in a crown."""
    x, y, z = at
    radius = 0.06 * size
    if simple:
        profile = round_profile(radius, (-90, -40, 0, 40, 90))
    else:
        profile = round_profile(radius, (-90, -60, -30, 0, 30, 60, 90), dimple=radius * 0.06)
    ob = lpm.lathe(name, profile, segments=6 if simple else 8, at=(x, y, z), color=P["fruit"])
    lpm.paint(ob, P["fruit_dark"], lambda c, n, i: n.z < -0.3)
    lpm.paint(ob, P["fruit_light"], lambda c, n, i: i % 4 == 0 and n.z > 0.2)
    if simple:
        return [ob]
    return [ob, lpm.prism(f"{name}_stem", 4, 0.006 * size, 0.03 * size, at=(x, y, z + radius * 2 * 0.92 - radius * 0.18), color=P["stem"])]


def tree(rng, name, trunk_height, trunk_radius, blobs, oranges=0, blossoms=0, colors=("leaf", "leaf_light", "leaf_dark")):
    """`blobs` lists the crown (dx, dy, dz, radius); oranges and blossoms sit on its surface."""
    parts = [lpm.prism(f"{name}_trunk", 6, trunk_radius, trunk_height, color=P["trunk"], radius_top=trunk_radius * 0.7)]
    parts.append(lpm.prism(f"{name}_foot", 6, trunk_radius * 1.4, 0.03, color=P["trunk_dark"], radius_top=trunk_radius))
    for k, (dx, dy, dz, radius) in enumerate(blobs):
        parts.append(blob(rng, f"{name}_crown{k}", (dx, dy, trunk_height * 0.8 + dz), radius, colors))
    for k in range(oranges + blossoms):
        dx, dy, dz, radius = blobs[k % len(blobs)]
        a = 2 * math.pi * k / (oranges + blossoms) + rng.uniform(-0.3, 0.3)
        height = radius * rng.uniform(0.3, 0.5)
        reach = radius * 1.02
        pos = (dx + reach * math.cos(a), dy + reach * math.sin(a), trunk_height * 0.8 + dz + height)
        if k < oranges:
            parts += orange(f"{name}_orange{k}", (pos[0], pos[1], pos[2] - 0.06), 1.5, rng, simple=True)
        else:
            parts.append(lpm.prism(f"{name}_blossom{k}", 5, 0.028, 0.012, at=pos, color=P["blossom"]))
    return parts


def stage_1(rng):
    parts = [lpm.prism("trunk", 5, 0.014, 0.13, color=P["trunk"], radius_top=0.008)]
    parts += [blade(f"leaf{k}", (0, 0, 0.1), 0.07, 0.025, 50, 90 * k + rng.uniform(-20, 20), "sprout", 0.4) for k in range(4)]
    return parts


def stage_2(rng):
    return tree(rng, "t", 0.22, 0.022, [(0, 0, 0, 0.13)])


def stage_3(rng):
    return tree(rng, "t", 0.3, 0.032, [(0, 0, 0, 0.2), (0.12, 0.05, -0.03, 0.13), (-0.1, -0.08, -0.04, 0.12)], blossoms=10)


def stage_4(rng):
    return tree(rng, "t", 0.3, 0.042, [(0, 0, 0, 0.3), (0.17, 0.06, -0.06, 0.17), (-0.16, -0.1, -0.07, 0.17), (0.03, -0.18, -0.08, 0.15)], oranges=7)


def harvested(rng):
    return tree(rng, "t", 0.3, 0.042, [(0, 0, 0, 0.3), (0.17, 0.06, -0.06, 0.17), (-0.16, -0.1, -0.07, 0.17), (0.03, -0.18, -0.08, 0.15)], colors=("leaf_gold", "leaf", "leaf_dark"))


def crop(rng):
    parts = []
    for k, (x, y) in enumerate(((-0.1, -0.07), (0.1, -0.05), (0.0, 0.1))):
        parts += orange(f"a{k}", (x, y, 0), 1.7, rng)
    parts.append(blade("leaf", (0.0, 0.1, 0.17), 0.07, 0.025, 70, 20, "leaf", 0.3))
    return parts


MODELS = {"orange-1": stage_1, "orange-2": stage_2, "orange-3": stage_3, "orange-4": stage_4, "orange-harvested": harvested, "orange-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
