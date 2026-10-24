import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("bamboo", "#7fb04a", 0.0, 0.8), ("bamboo_light", "#a6cf63", 0.0, 0.8), ("node", "#d8e2a0", 0.0, 0.8),
    ("shoot", "#c8b878", 0.0, 0.9), ("shoot_dark", "#a89860", 0.0, 0.9), ("leaf", "#5a9a3a", 0.0, 0.9), ("leaf_dark", "#3f7f33", 0.0, 0.9),
    ("cut", "#e9dcae", 0.0, 0.9), ("inner", "#cfc08a", 0.0, 0.9),
])

SPOTS = [(0.0, 0.0), (-0.22, -0.18), (0.22, -0.15), (-0.2, 0.2), (0.2, 0.22)]


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def culm(rng, name, at, height, radius, rings, leaf_levels):
    x, y, _ = at
    lean, yaw = rng.uniform(0, 3), rng.uniform(0, 360)
    parts = [lpm.prism(f"{name}_stalk", 5, radius, height, color=P["bamboo_light" if rings % 2 else "bamboo"], radius_top=radius * 0.8)]
    for k in range(1, rings + 1):
        z = height * k / (rings + 1)
        parts.append(lpm.prism(f"{name}_node{k}", 5, radius * 1.3, 0.012, at=(0, 0, z), color=P["node"]))
    for ob in parts:
        lpm.rotate(ob, lean, "Y")
        lpm.rotate(ob, yaw, "Z")
        lpm.move(ob, x, y, 0)
    for level, fraction in enumerate(leaf_levels):
        top = (x + height * fraction * math.sin(math.radians(lean)) * math.cos(math.radians(yaw)), y + height * fraction * math.sin(math.radians(lean)) * math.sin(math.radians(yaw)), height * fraction)
        for k in range(4):
            parts.append(blade(f"{name}_leaf{level}_{k}", top, 0.15 * (1.1 - 0.3 * fraction), 0.03, 62 + rng.uniform(-8, 8), 90 * k + 45 * level + rng.uniform(-15, 15), ("leaf", "leaf_dark")[k % 2], 0.3))
    return parts


def field(rng, heights, radius, rings, leaf_levels):
    parts = []
    for k, ((x, y), height) in enumerate(zip(SPOTS, heights)):
        parts += culm(rng, f"c{k}", (x + rng.uniform(-0.02, 0.02), y + rng.uniform(-0.02, 0.02), 0), height, radius, rings, leaf_levels)
    return parts


def stage_1(rng):
    parts = []
    for k, ((x, y), height) in enumerate(zip(SPOTS, (0.12, 0.09, 0.1, 0.08, 0.11))):
        shoot = lpm.prism(f"shoot{k}", 6, 0.045, height, at=(x, y, 0), color=P["shoot"], radius_top=0.006)
        lpm.paint(shoot, P["shoot_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.7)
        parts.append(shoot)
    return parts


def stage_2(rng):
    return field(rng, (0.28, 0.22, 0.25, 0.2, 0.26), 0.03, 2, (1.0,))


def stage_3(rng):
    return field(rng, (0.6, 0.5, 0.55, 0.45, 0.52), 0.035, 4, (0.95, 0.7))


def stage_4(rng):
    return field(rng, (0.95, 0.8, 0.88, 0.75, 0.85), 0.04, 5, (0.97, 0.78, 0.6))


def section(name, at, length, radius):
    x, y, z = at
    body = lpm.prism(f"{name}_body", 6, radius, length, color=P["bamboo"], radius_top=radius)
    parts = [body]
    for k in (1, 2):
        parts.append(lpm.prism(f"{name}_node{k}", 6, radius * 1.15, 0.012, at=(0, 0, length * k / 3), color=P["node"]))
    for end in (0.0, length - 0.006):
        parts.append(lpm.prism(f"{name}_end{int(end > 0)}", 6, radius * 0.8, 0.006, at=(0, 0, end), color=P["inner"]))
    for ob in parts:
        lpm.rotate(ob, 90, "Y")
        lpm.move(ob, x - length / 2, y, z + radius)
    return parts


def crop(rng):
    return section("a", (0, -0.065, 0), 0.38, 0.055) + section("b", (0, 0.065, 0), 0.36, 0.055) + section("c", (0.02, 0.0, 0.09), 0.38, 0.055)


MODELS = {"bamboo-1": stage_1, "bamboo-2": stage_2, "bamboo-3": stage_3, "bamboo-4": stage_4, "bamboo-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
