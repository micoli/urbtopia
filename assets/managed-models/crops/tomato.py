import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("stem", "#5b9a3c", 0.0, 0.9), ("leaf", "#4a9a3a", 0.0, 0.9), ("leaf_dark", "#3a8031", 0.0, 0.9), ("leaf_light", "#6cba48", 0.0, 0.9),
    ("tomato", "#e03a2e", 0.0, 0.7), ("tomato_dark", "#b8281f", 0.0, 0.7), ("tomato_light", "#ff6a4d", 0.0, 0.7),
    ("green_fruit", "#8fc35a", 0.0, 0.7), ("calyx", "#3f8a35", 0.0, 0.9),
    ("stake", "#b98850", 0.0, 0.9), ("dry", "#c9b45e", 0.0, 0.9), ("dry_dark", "#a89040", 0.0, 0.9),
])

SPOTS = [(-0.2, -0.2), (0.2, -0.2), (-0.2, 0.2), (0.2, 0.2)]


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def compound_leaf(name, at, size, yaw, colors):
    """Three leaflets fanned from one point."""
    return [blade(f"{name}_{k}", at, 0.19 * size, 0.06, 58, yaw + 38 * (k - 1), colors[k % len(colors)], 0.3) for k in range(3)]


def fruit(name, at, size, color, lit=True):
    x, y, z = at
    profile = [(0.005, 0), (0.04 * size, 0.02 * size), (0.04 * size, 0.05 * size), (0.005, 0.07 * size)]
    ob = lpm.lathe(name, profile, segments=5, at=(x, y, z), color=P[color])
    if lit:
        lpm.paint(ob, P["tomato_light"] if color == "tomato" else P[color], lambda c, n, i: n.z > 0.5)
    cap = blade(f"{name}_calyx", (x, y, z + 0.068 * size), 0.03 * size, 0.012 * size, 0, 0, "calyx")
    return [ob, cap]


def plant(rng, name, at, height, leaves, stake=0.0, fruits=0, fruit_color="tomato", leaf_colors=("leaf", "leaf_dark", "leaf_light"), droop=False):
    x, y, _ = at
    parts = [lpm.prism(f"{name}_stem", 5, 0.018, height, at=(x, y, 0), color=P["stem"] if not droop else P["dry_dark"], radius_top=0.01)]
    if stake:
        parts.append(lpm.prism(f"{name}_stake", 4, 0.012, stake, at=(x + 0.055, y, 0), color=P["stake"], radius_top=0.008))
    for k in range(leaves):
        z = height * (0.25 + 0.7 * k / max(1, leaves - 1))
        yaw = 137 * k + rng.uniform(-20, 20)
        parts += compound_leaf(f"{name}_l{k}", (x, y, z), 1.0 - 0.25 * k / max(1, leaves), yaw, leaf_colors)
    for k in range(fruits):
        a = 2 * math.pi * k / fruits + rng.uniform(-0.4, 0.4)
        parts += fruit(f"{name}_f{k}", (x + 0.09 * math.cos(a), y + 0.09 * math.sin(a), height * (0.2 + 0.18 * k)), 1.6, fruit_color)
    return parts


def field(rng, **kwargs):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        parts += plant(rng, f"p{k}", (px + rng.uniform(-0.02, 0.02), py + rng.uniform(-0.02, 0.02), 0), **kwargs)
    return parts


def stage_1(rng):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        for j in range(3):
            parts.append(blade(f"s{k}_{j}", (px, py, 0), 0.08, 0.02, 30 + 8 * j, 120 * j + rng.uniform(-20, 20), "sprout" if j else "leaf_light", 0.3))
    return parts


def stage_2(rng):
    return field(rng, height=0.2, leaves=3, stake=0.3)


def stage_3(rng):
    return field(rng, height=0.45, leaves=5, stake=0.55, fruits=2, fruit_color="green_fruit")


def stage_4(rng):
    return field(rng, height=0.5, leaves=5, stake=0.6, fruits=3)


def harvested(rng):
    return field(rng, height=0.4, leaves=4, stake=0.55, leaf_colors=("dry", "dry_dark"), droop=True)


def crop(rng):
    parts = []
    for k, (x, y) in enumerate(((-0.1, -0.08), (0.1, -0.06), (0.0, 0.1))):
        parts += fruit(f"c{k}", (x, y, 0), 2.2, "tomato")
    return parts


MODELS = {"tomato-1": stage_1, "tomato-2": stage_2, "tomato-3": stage_3, "tomato-4": stage_4, "tomato-harvested": harvested, "tomato-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 900, OUT_DIR)
