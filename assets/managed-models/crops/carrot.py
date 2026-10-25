import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("leaf", "#5fb04a", 0.0, 0.9), ("leaf_dark", "#438f3a", 0.0, 0.9), ("leaf_light", "#86cf55", 0.0, 0.9),
    ("carrot", "#f28a1e", 0.0, 0.8), ("carrot_dark", "#d9700f", 0.0, 0.8), ("carrot_light", "#ffa844", 0.0, 0.8),
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


def frond(name, at, first, second, lean_a, lean_b, yaw, color):
    """A leaf stalk that rises then bends outwards."""
    sin_a, cos_a = math.sin(math.radians(lean_a)), math.cos(math.radians(lean_a))
    mid = (at[0] + first * sin_a * math.cos(math.radians(yaw)), at[1] + first * sin_a * math.sin(math.radians(yaw)), at[2] + first * cos_a)
    return [blade(f"{name}_a", at, first, 0.016, lean_a, yaw, color, 0.35), blade(f"{name}_b", mid, second, 0.026, lean_b, yaw, color, 0.35)]


def plant(rng, name, at, fronds, first, second, shoulder=0.0, spread=0.0):
    x, y, _ = at
    parts = []
    if shoulder:
        crown = lpm.prism(f"{name}_root", 6, 0.05, shoulder, at=(x, y, 0), color=P["carrot"], radius_top=0.036, rotate=rng.uniform(0, 60))
        lpm.paint(crown, P["carrot_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.5)
        parts += [crown, lpm.prism(f"{name}_top", 6, 0.03, 0.008, at=(x, y, shoulder), color=P["carrot_light"])]
    for k in range(fronds):
        yaw = 360 * k / fronds + rng.uniform(-20, 20)
        scale = rng.uniform(0.8, 1.0)
        parts += frond(f"{name}_f{k}", (x, y, shoulder * 0.9), first * scale, second * scale, 14 + spread + rng.uniform(-4, 4), 55 + rng.uniform(-8, 8), yaw, ("leaf", "leaf_dark", "leaf_light")[k % 3])
    return parts


def field(rng, **kwargs):
    parts = []
    for k, (px, py) in enumerate(spots(rng)):
        parts += plant(rng, f"p{k}", (px, py, 0), **kwargs)
    return parts


def stage_1(rng):
    parts = []
    for k, (px, py) in enumerate(spots(rng)):
        for j in range(3):
            parts.append(blade(f"s{k}_{j}", (px, py, 0), 0.08 + 0.015 * j, 0.012, 18 + 6 * j, 120 * j + rng.uniform(-20, 20), "sprout" if j else "leaf_light", 0.35))
    return parts


def stage_2(rng):
    return field(rng, fronds=4, first=0.1, second=0.1)


def stage_3(rng):
    return field(rng, fronds=4, first=0.16, second=0.14, shoulder=0.02, spread=2)


def stage_4(rng):
    return field(rng, fronds=5, first=0.2, second=0.16, shoulder=0.055, spread=4)


def carrot(name, at, yaw):
    body = lpm.prism(f"{name}_body", 6, 0.048, 0.28, color=P["carrot"], radius_top=0.008)
    lpm.paint(body, P["carrot_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.5)
    lpm.rotate(body, 90, "Y")
    lpm.move(body, -0.1, 0, 0.048)
    parts = [body]
    for k in range(3):
        green = blade(f"{name}_g{k}", (0, 0, 0), 0.13, 0.016, -78 + 10 * (k - 1), 0, ("leaf", "leaf_dark", "leaf_light")[k], 0.35)
        lpm.move(green, -0.1, 0.02 * (k - 1), 0.05)
        parts.append(green)
    for ob in parts:
        lpm.rotate(ob, yaw, "Z")
        lpm.move(ob, *at)
    return parts


def crop(rng):
    return carrot("a", (0, -0.1, 0), 20) + carrot("b", (0.02, 0.0, 0), -2) + carrot("c", (0, 0.1, 0), -22)


MODELS = {"carrot-1": stage_1, "carrot-2": stage_2, "carrot-3": stage_3, "carrot-4": stage_4, "carrot-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
