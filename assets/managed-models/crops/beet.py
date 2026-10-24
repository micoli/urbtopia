import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#9fd85a", 0.0, 0.9), ("leaf", "#4f9a43", 0.0, 0.9), ("leaf_dark", "#3a7d3a", 0.0, 0.9), ("leaf_light", "#78b84d", 0.0, 0.9),
    ("stem", "#b8264a", 0.0, 0.9), ("stem_dark", "#8e1f3c", 0.0, 0.9),
    ("beet", "#8e1f5a", 0.0, 0.8), ("beet_dark", "#6f1448", 0.0, 0.8), ("beet_light", "#b5326f", 0.0, 0.8),
])

SPACING = 0.25


def spots(rng):
    return [(x * SPACING + rng.uniform(-0.03, 0.03), y * SPACING + rng.uniform(-0.03, 0.03)) for x in (-1, 0, 1) for y in (-1, 0, 1)]


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def leaf(name, at, stalk, blade_length, lean, yaw, color):
    """A red leaf stalk with a broad blade bending out from its tip."""
    sin_a, cos_a = math.sin(math.radians(lean)), math.cos(math.radians(lean))
    tip = (at[0] + stalk * sin_a * math.cos(math.radians(yaw)), at[1] + stalk * sin_a * math.sin(math.radians(yaw)), at[2] + stalk * cos_a)
    return [blade(f"{name}_s", at, stalk, 0.014, lean, yaw, "stem"), blade(f"{name}_b", tip, blade_length, 0.05, lean + 38, yaw, color, 0.3)]


def root(name, at, size, rng):
    profile = [(0.005, 0), (0.07 * size, 0.025 * size), (0.066 * size, 0.07 * size), (0.005, 0.1 * size)]
    ob = lpm.lathe(name, profile, segments=6, at=at, color=P["beet"])
    lpm.rotate(ob, rng.uniform(0, 60), "Z", about=at)
    lpm.paint(ob, P["beet_light"], lambda c, n, i: n.z > 0.5)
    lpm.paint(ob, P["beet_dark"], lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.5)
    return ob


def plant(rng, name, at, leaves, stalk, blade_length, size=0.0):
    x, y, _ = at
    parts = [root(f"{name}_root", (x, y, 0), size, rng)] if size else []
    base_z = size * 0.07
    for k in range(leaves):
        yaw = 360 * k / leaves + rng.uniform(-20, 20)
        scale = rng.uniform(0.85, 1.0)
        parts += leaf(f"{name}_l{k}", (x, y, base_z), stalk * scale, blade_length * scale, 16 + rng.uniform(-4, 6), yaw, ("leaf", "leaf_dark", "leaf_light")[k % 3])
    return parts


def field(rng, **kwargs):
    parts = []
    for k, (px, py) in enumerate(spots(rng)):
        parts += plant(rng, f"p{k}", (px, py, 0), **kwargs)
    return parts


def stage_1(rng):
    parts = []
    for k, (px, py) in enumerate(spots(rng)):
        for j in range(2):
            parts.append(blade(f"s{k}_{j}", (px, py, 0), 0.08, 0.02, 20 + 8 * j, 180 * j + rng.uniform(-30, 30), "sprout" if j else "leaf_light", 0.3))
    return parts


def stage_2(rng):
    return field(rng, leaves=3, stalk=0.07, blade_length=0.1)


def stage_3(rng):
    return field(rng, leaves=4, stalk=0.1, blade_length=0.14, size=0.5)


def stage_4(rng):
    return field(rng, leaves=4, stalk=0.13, blade_length=0.17, size=1.0)


def beet(name, at, rng):
    x, y, _ = at
    profile = [(0.005, 0), (0.06, 0.02), (0.085, 0.075), (0.06, 0.125), (0.005, 0.15)]
    body = lpm.lathe(f"{name}_body", profile, segments=7, at=(x, y, 0.01), color=P["beet"])
    lpm.paint(body, P["beet_light"], lambda c, n, i: n.z > 0.5)
    lpm.paint(body, P["beet_dark"], lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.5)
    stubs = [blade(f"{name}_stub{k}", (x, y, 0.15), 0.07, 0.014, 25, 120 * k + rng.uniform(-20, 20), "stem") for k in range(3)]
    return [body] + stubs


def crop(rng):
    return beet("a", (-0.1, -0.08, 0), rng) + beet("b", (0.1, -0.05, 0), rng) + beet("c", (0.0, 0.1, 0), rng)


MODELS = {"beet-1": stage_1, "beet-2": stage_2, "beet-3": stage_3, "beet-4": stage_4, "beet-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
