import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("leaf", "#6cbf45", 0.0, 0.9), ("leaf_dark", "#4fa03a", 0.0, 0.9),
    ("leaf_gold", "#b9c657", 0.0, 0.9), ("stem_gold", "#e3c660", 0.0, 0.9), ("grain", "#f0d878", 0.0, 0.8),
    ("grain_dark", "#d9b44a", 0.0, 0.8), ("burlap", "#cfae72", 0.0, 0.95), ("burlap_dark", "#a98a52", 0.0, 0.95),
    ("twine", "#b5553a", 0.0, 0.8), ("white", "#f6f2e8", 0.0, 0.8),
])

SPACING = 0.22


def clumps(rng):
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


def arch(name, at, first, second, lean_a, lean_b, yaw, width, color, flat=1.0):
    """A blade that rises by `lean_a` degrees over `first`, then bends to `lean_b` over `second`; returns the parts and the tip."""
    sin_a, cos_a = math.sin(math.radians(lean_a)), math.cos(math.radians(lean_a))
    sin_b, cos_b = math.sin(math.radians(lean_b)), math.cos(math.radians(lean_b))
    sy, cy = math.sin(math.radians(yaw)), math.cos(math.radians(yaw))
    mid = (at[0] + first * sin_a * cy, at[1] + first * sin_a * sy, at[2] + first * cos_a)
    tip = (mid[0] + second * sin_b * cy, mid[1] + second * sin_b * sy, mid[2] + second * cos_b)
    parts = [blade(f"{name}_a", at, first, width, lean_a, yaw, color, flat), blade(f"{name}_b", mid, second, width * 0.8, lean_b, yaw, color, flat)]
    return parts, tip


def patch(rng, stems, first, second, lean_a, lean_b, colors, flat=0.3, width=0.022):
    parts = []
    for c, (cx, cy) in enumerate(clumps(rng)):
        for k in range(stems):
            a = 2 * math.pi * k / stems + rng.uniform(-0.5, 0.5)
            r = rng.uniform(0.0, 0.04)
            scale = rng.uniform(0.85, 1.0)
            more, _ = arch(f"c{c}_{k}", (cx + r * math.cos(a), cy + r * math.sin(a), 0), first * scale, second * scale, lean_a + rng.uniform(-4, 4), lean_b + rng.uniform(-8, 8), math.degrees(a), width, rng.choice(colors), flat)
            parts += more
    return parts


def stage_1(rng):
    return patch(rng, 3, 0.07, 0.05, 15, 55, ("sprout", "leaf"))


def stage_2(rng):
    return patch(rng, 4, 0.16, 0.14, 18, 58, ("leaf", "sprout", "leaf_dark"))


def stage_3(rng):
    return patch(rng, 4, 0.3, 0.16, 12, 42, ("leaf", "leaf_dark", "leaf"), width=0.024)


def stage_4(rng):
    parts = []
    for c, (cx, cy) in enumerate(clumps(rng)):
        for k in range(3):
            a = 2 * math.pi * k / 3 + rng.uniform(-0.5, 0.5)
            r = rng.uniform(0.0, 0.04)
            at = (cx + r * math.cos(a), cy + r * math.sin(a), 0)
            yaw = math.degrees(a)
            scale = rng.uniform(0.9, 1.0)
            stem, tip = arch(f"c{c}_{k}", at, 0.38 * scale, 0.17 * scale, 8, 45, yaw, 0.012, "stem_gold")
            parts += stem
            grains = lpm.prism(f"c{c}_{k}_grains", 4, 0.032, 0.13, color=P["grain" if k % 2 else "grain_dark"], radius_top=0.006)
            lpm.rotate(grains, 160, "Y")
            lpm.rotate(grains, yaw, "Z")
            parts.append(lpm.move(grains, *tip))
        for k in range(2):
            a = 2 * math.pi * k / 2 + rng.uniform(0, 1.5)
            more, _ = arch(f"c{c}_leaf{k}", (cx, cy, 0), 0.22, 0.12, 15, 55, math.degrees(a), 0.024, "leaf_gold", 0.3)
            parts += more
    return parts


def crop(rng):
    profile = [(0.005, 0), (0.19, 0.0), (0.18, 0.025), (0.13, 0.07), (0.075, 0.115), (0.03, 0.145), (0.005, 0.155)]
    heap = lpm.lathe("heap", profile, segments=9, color=P["grain"])
    lpm.paint(heap, P["grain_dark"], lambda c, n, i: i % 3 == 0 and n.z < 0.9)
    lpm.paint(heap, P["white"], lambda c, n, i: i % 5 == 1 and n.z > 0.3)
    parts = [heap]
    for k in range(10):
        a = 2 * math.pi * k / 10 + rng.uniform(-0.2, 0.2)
        r = rng.uniform(0.17, 0.2)
        parts.append(lpm.prism(f"grain{k}", 4, 0.012, 0.014, at=(r * math.cos(a), r * math.sin(a), 0), color=P["grain" if k % 2 else "white"], radius_top=0.006, rotate=math.degrees(a)))
    return parts


MODELS = {"rice-1": stage_1, "rice-2": stage_2, "rice-3": stage_3, "rice-4": stage_4, "rice-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
