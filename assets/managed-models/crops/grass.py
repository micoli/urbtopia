import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("grass", "#7cbf4a", 0.0, 0.9), ("grass_dark", "#5f9f3a", 0.0, 0.9), ("grass_light", "#95d15c", 0.0, 0.9),
    ("seed", "#d9cf7a", 0.0, 0.9),
])

TUFTS = [(0.0, 0.0), (-0.22, -0.2), (0.22, -0.2), (-0.22, 0.2), (0.22, 0.2)]
SHADES = ("grass", "grass_dark", "grass_light")


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def arching_blade(name, at, length, lean_a, lean_b, yaw, color, seed=False):
    """A blade rising by `lean_a` then bending to `lean_b`; `seed` tops it with a tan seed head."""
    first, second = length * 0.6, length * 0.45
    sin_a, cos_a = math.sin(math.radians(lean_a)), math.cos(math.radians(lean_a))
    sin_b, cos_b = math.sin(math.radians(lean_b)), math.cos(math.radians(lean_b))
    cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    mid = (at[0] + first * sin_a * cy, at[1] + first * sin_a * sy, at[2] + first * cos_a)
    tip = (mid[0] + second * sin_b * cy, mid[1] + second * sin_b * sy, mid[2] + second * cos_b)
    parts = [blade(f"{name}_a", at, first, 0.02, lean_a, yaw, color, 0.5), blade(f"{name}_b", mid, second, 0.017, lean_b, yaw, color, 0.5)]
    if seed:
        head = lpm.prism(f"{name}_seed", 4, 0.016, 0.07, color=P["seed"], radius_top=0.004)
        lpm.rotate(head, lean_b, "Y")
        lpm.rotate(head, yaw, "Z")
        parts.append(lpm.move(head, *tip))
    return parts


def field(rng, blades, length, lean_a, lean_b, seeds=0):
    parts = []
    for t, (tx, ty) in enumerate(TUFTS):
        tx += rng.uniform(-0.02, 0.02)
        ty += rng.uniform(-0.02, 0.02)
        for k in range(blades):
            yaw = 360 * k / blades + rng.uniform(-20, 20)
            r = rng.uniform(0.0, 0.04)
            parts += arching_blade(f"t{t}_{k}", (tx + r * math.cos(math.radians(yaw)), ty + r * math.sin(math.radians(yaw)), 0), length * rng.uniform(0.7, 1.0),
                                   lean_a + rng.uniform(-4, 6), lean_b + rng.uniform(-8, 8), yaw, SHADES[k % 3], seed=k < seeds)
    return parts


def stage_1(rng):
    parts = []
    for t, (tx, ty) in enumerate(TUFTS):
        for k in range(4):
            parts.append(blade(f"s{t}_{k}", (tx, ty, 0), 0.06, 0.016, 15 + 6 * k, 90 * k + rng.uniform(-20, 20), "sprout" if k % 2 else "grass_light", 0.5))
    return parts


def stage_2(rng):
    return field(rng, 6, 0.16, 12, 45)


def stage_3(rng):
    return field(rng, 8, 0.3, 10, 40)


def stage_4(rng):
    return field(rng, 10, 0.45, 8, 38, seeds=3)


MODELS = {"grass-1": stage_1, "grass-2": stage_2, "grass-3": stage_3, "grass-4": stage_4}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
