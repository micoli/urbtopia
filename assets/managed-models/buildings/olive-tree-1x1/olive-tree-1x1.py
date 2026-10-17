import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

MODEL_ID = "olive-tree-1x1"
BUDGET = 1000

PALETTE = lpm.Palette([
    ("bark", "#8b7a66", 0.0, 0.95),
    ("bark_dark", "#5f5244", 0.0, 0.95),
    ("leaf", "#8fa36a", 0.0, 0.8),
    ("leaf_light", "#b3c48f", 0.0, 0.8),
    ("leaf_dark", "#6b8450", 0.0, 0.8),
    ("olive_green", "#7d8a2e", 0.0, 0.5),
    ("olive_black", "#2f2a35", 0.0, 0.4),
    ("soil", "#a8845a", 0.0, 1.0),
])

FORK_Z = 0.14
STEM_TILT = 20
STEM_LENGTH = 0.36
STEM_YAWS = (30, 150, 270)
CROWN_FLATTEN = 0.8
CROWN = [
    # (yaw deg, distance from axis, z, radius, color)
    (0, 0.24, 0.4, 0.21, "leaf"),
    (72, 0.24, 0.56, 0.21, "leaf_dark"),
    (144, 0.24, 0.46, 0.21, "leaf_light"),
    (216, 0.24, 0.64, 0.21, "leaf"),
    (288, 0.24, 0.5, 0.21, "leaf_dark"),
]
OLIVES_PER_BLOB = 4
BLACK_EVERY = 3


def foliage(name, radius, at, color):
    profile = [(0, -radius * 0.8), (radius * 0.72, -radius * 0.5), (radius, 0), (radius * 0.72, radius * 0.5), (0, radius * 0.8)]
    ob = lpm.lathe(name, profile, segments=8, at=at, color=PALETTE[color])
    lpm.scale(ob, 1, 1, CROWN_FLATTEN, about=at)
    return ob


def olive(name, at, color):
    r = 0.034
    profile = [(0, -r * 1.3), (r * 0.9, -r * 0.2), (r * 0.7, r * 0.8), (0, r * 1.2)]
    return lpm.lathe(name, profile, segments=5, at=at, color=PALETTE[color])


def make_parts():
    parts = []
    parts.append(lpm.prism("mound", 8, 0.17, 0.025, color=PALETTE["soil"], radius_top=0.12))
    parts.append(lpm.prism("root_flare", 8, 0.13, 0.08, at=(0, 0, 0.02), color=PALETTE["bark_dark"], radius_top=0.085))
    parts.append(lpm.prism("trunk", 8, 0.085, FORK_Z - 0.06, at=(0, 0, 0.1), color=PALETTE["bark"], radius_top=0.075))

    for i, yaw in enumerate(STEM_YAWS):
        stem = lpm.prism(f"stem{i}", 6, 0.07, STEM_LENGTH, color=PALETTE["bark"], radius_top=0.035)
        lpm.rotate(stem, STEM_TILT + 6 * i, "Y")
        lpm.rotate(stem, yaw, "Z")
        lpm.move(stem, 0, 0, FORK_Z)
        parts.append(stem)

    centers = []
    for i, (yaw, dist, z, radius, color) in enumerate(CROWN):
        a = math.radians(yaw)
        center = (dist * math.cos(a), dist * math.sin(a), z)
        centers.append((center, radius, yaw))
        parts.append(foliage(f"crown{i}", radius, center, color))

    for crown_index, ((cx, cy, cz), radius, yaw) in enumerate(centers):
        for k in range(OLIVES_PER_BLOB):
            n = crown_index * OLIVES_PER_BLOB + k
            a = math.radians(yaw + 90 * k + 23 * crown_index)
            reach = radius * (0.88 + 0.08 * (k % 2))
            drop = radius * CROWN_FLATTEN * (0.45 + 0.2 * ((k + crown_index) % 2))
            color = "olive_black" if n % BLACK_EVERY == 0 else "olive_green"
            parts.append(olive(f"olive{n}", (cx + reach * math.cos(a), cy + reach * math.sin(a), cz - drop), color))
    return parts


out_dir = os.path.dirname(os.path.abspath(__file__))
lpm.reset()
tree = lpm.finish(MODEL_ID, make_parts(), PALETTE, budget=BUDGET, center=False)
lpm.export_glb(tree, os.path.join(out_dir, MODEL_ID))
