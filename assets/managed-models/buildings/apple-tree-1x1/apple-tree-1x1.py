import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

MODEL_ID = "apple-tree-1x1"
BUDGET = 700

PALETTE = lpm.Palette([
    ("bark", "#8a5a34", 0.0, 0.9),
    ("bark_dark", "#6e4222", 0.0, 0.9),
    ("leaf", "#5fae4a", 0.0, 0.8),
    ("leaf_dark", "#3f8a3a", 0.0, 0.8),
    ("leaf_light", "#86c85a", 0.0, 0.8),
    ("apple", "#d83a3a", 0.0, 0.5),
    ("apple_dark", "#b02a2a", 0.0, 0.5),
    ("soil", "#7a5230", 0.0, 1.0),
])

CANOPY_CENTER_Z = 0.56
BLOBS = [
    # (dx, dy, dz, radius, color)
    (0.00, 0.00, 0.00, 0.33, "leaf"),
    (0.20, 0.06, -0.06, 0.20, "leaf_dark"),
    (-0.18, 0.10, -0.04, 0.21, "leaf_dark"),
    (0.04, -0.20, -0.05, 0.20, "leaf"),
    (-0.06, 0.02, 0.17, 0.20, "leaf_light"),
]
APPLES = [
    # (yaw deg, elevation deg, blob index)
    (20, 10, 0),
    (110, -15, 0),
    (200, 25, 0),
    (300, 0, 0),
    (350, 15, 1),
    (160, 5, 2),
    (260, -5, 3),
]


def blob(name, radius, at, color):
    profile = [(0, -radius * 0.8), (radius * 0.72, -radius * 0.55), (radius, 0), (radius * 0.74, radius * 0.6), (0, radius * 0.9)]
    return lpm.lathe(name, profile, segments=8, at=at, color=PALETTE[color])


def apple(name, at):
    r = 0.04
    profile = [(0, -r), (r, -r * 0.2), (r * 0.8, r * 0.6), (0, r * 0.8)]
    return lpm.lathe(name, profile, segments=6, at=at, color=PALETTE["apple"])


def make_parts():
    parts = []
    parts.append(lpm.prism("mound", 8, 0.16, 0.025, color=PALETTE["soil"], radius_top=0.12))
    parts.append(lpm.prism("flare", 8, 0.10, 0.07, at=(0, 0, 0.02), color=PALETTE["bark_dark"], radius_top=0.065))
    parts.append(lpm.prism("trunk", 8, 0.065, 0.36, at=(0, 0, 0.08), color=PALETTE["bark"], radius_top=0.05))
    for i, yaw in enumerate((20, 140, 260)):
        branch = lpm.prism(f"branch{i}", 6, 0.035, 0.22, color=PALETTE["bark"], radius_top=0.022)
        lpm.rotate(branch, 35, "Y")
        lpm.rotate(branch, yaw, "Z")
        lpm.move(branch, 0, 0, 0.36)
        parts.append(branch)

    centers = []
    for i, (dx, dy, dz, radius, color) in enumerate(BLOBS):
        center = (dx, dy, CANOPY_CENTER_Z + dz)
        centers.append((center, radius))
        parts.append(blob(f"blob{i}", radius, center, color))

    for i, (yaw, elevation, blob_index) in enumerate(APPLES):
        (cx, cy, cz), radius = centers[blob_index]
        reach = radius * 0.98
        a, e = math.radians(yaw), math.radians(elevation)
        at = (cx + reach * math.cos(e) * math.cos(a), cy + reach * math.cos(e) * math.sin(a), cz + reach * math.sin(e) - 0.02)
        parts.append(apple(f"apple{i}", at))
    return parts


out_dir = os.path.dirname(os.path.abspath(__file__))
lpm.reset()
tree = lpm.finish(MODEL_ID, make_parts(), PALETTE, budget=BUDGET, center=False)
lpm.export_glb(tree, os.path.join(out_dir, MODEL_ID))
