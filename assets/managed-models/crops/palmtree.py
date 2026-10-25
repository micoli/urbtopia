import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("trunk", "#9a7348", 0.0, 0.9), ("trunk_dark", "#7d5a36", 0.0, 0.9),
    ("frond", "#4a9a40", 0.0, 0.9), ("frond_dark", "#3a7f38", 0.0, 0.9), ("frond_light", "#6cb04a", 0.0, 0.9),
    ("coconut", "#7a5230", 0.0, 0.8), ("coconut_dark", "#573820", 0.0, 0.8), ("coconut_light", "#9a6c42", 0.0, 0.8),
    ("dry", "#b0a45a", 0.0, 0.9), ("dry_dark", "#8f8446", 0.0, 0.9),
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


def trunk(name, height, radius, segments, curve):
    """A trunk built from ringed segments that lean progressively towards +X; returns the parts and the top point."""
    parts = []
    base = (0.0, 0.0, 0.0)
    length = height / segments
    for k in range(segments):
        lean = curve * (k + 1)
        r0 = radius * (1 - 0.35 * k / segments)
        r1 = radius * (1 - 0.35 * (k + 1) / segments)
        seg = lpm.prism(f"{name}_seg{k}", 6, r0, length * 1.04, color=P["trunk" if k % 2 == 0 else "trunk_dark"], radius_top=r1)
        lpm.rotate(seg, lean, "Y")
        lpm.move(seg, *base)
        parts.append(seg)
        base = (base[0] + length * math.sin(math.radians(lean)), 0.0, base[2] + length * math.cos(math.radians(lean)))
    return parts, base


def frond(name, at, length, yaw, color, droop=0.0):
    first, second = length * 0.55, length * 0.5
    lean_a, lean_b = 50 + droop * 0.4, 100 + droop
    sin_a, cos_a = math.sin(math.radians(lean_a)), math.cos(math.radians(lean_a))
    mid = (at[0] + first * sin_a * math.cos(math.radians(yaw)), at[1] + first * sin_a * math.sin(math.radians(yaw)), at[2] + first * cos_a)
    return [blade(f"{name}_a", at, first, 0.06, lean_a, yaw, color, 0.25), blade(f"{name}_b", mid, second, 0.05, lean_b, yaw, color, 0.25)]


def coconut(name, at, radius):
    x, y, z = at
    points = [(max(0.005, radius * math.cos(math.radians(a))), radius * 0.95 * (1 + math.sin(math.radians(a)))) for a in (-90, -40, 0, 40, 90)]
    ob = lpm.lathe(name, points, segments=6, at=(x, y, z), color=P["coconut"])
    lpm.paint(ob, P["coconut_dark"], lambda c, n, i: n.z < -0.3)
    lpm.paint(ob, P["coconut_light"], lambda c, n, i: n.z > 0.5)
    return ob


def palm(rng, height, radius, segments, fronds, frond_length, nuts=0, dry=0):
    parts, top = trunk("t", height, radius, segments, 4)
    for k in range(fronds):
        yaw = 360 * k / fronds + rng.uniform(-15, 15)
        dried = k < dry
        parts += frond(f"f{k}", top, frond_length * rng.uniform(0.9, 1.05), yaw, ("dry", "dry_dark")[k % 2] if dried else ("frond", "frond_dark", "frond_light")[k % 3], droop=35 if dried else 0)
    for k in range(nuts):
        a = 2 * math.pi * k / nuts + rng.uniform(-0.3, 0.3)
        parts.append(coconut(f"n{k}", (top[0] + 0.06 * math.cos(a), 0.06 * math.sin(a), top[2] - 0.08), 0.045))
    return parts


def stage_1(rng):
    return [blade(f"s{k}", (0, 0, 0), 0.09, 0.025, 25 + 8 * (k % 2), 90 * k + rng.uniform(-20, 20), "sprout", 0.3) for k in range(4)]


def stage_2(rng):
    return palm(rng, 0.2, 0.03, 3, 5, 0.2)


def stage_3(rng):
    return palm(rng, 0.38, 0.038, 4, 7, 0.3)


def stage_4(rng):
    return palm(rng, 0.55, 0.045, 5, 8, 0.36, nuts=4)


def harvested(rng):
    return palm(rng, 0.55, 0.045, 5, 8, 0.36, dry=2)


def crop(rng):
    return [coconut(f"c{k}", pos, 0.07) for k, pos in enumerate(((-0.08, -0.06, 0), (0.09, -0.04, 0), (0.0, 0.09, 0)))]


MODELS = {"palmtree-1": stage_1, "palmtree-2": stage_2, "palmtree-3": stage_3, "palmtree-4": stage_4, "palmtree-harvested": harvested, "palmtree-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
