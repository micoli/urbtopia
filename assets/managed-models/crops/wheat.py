import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#9fd85a", 0.0, 0.9), ("leaf", "#6bb043", 0.0, 0.9), ("leaf_dark", "#4e9136", 0.0, 0.9),
    ("stalk_green", "#a6c850", 0.0, 0.9), ("ear_green", "#c4cf5a", 0.0, 0.9),
    ("gold", "#e8c35a", 0.0, 0.8), ("gold_dark", "#c99a2e", 0.0, 0.8), ("straw", "#dcbf6e", 0.0, 0.9),
    ("twine", "#b5553a", 0.0, 0.8),
])

CLUMP_SPACING = 0.27


def clumps(rng):
    """Jittered 3x3 grid of clump centres, a wheat patch about 0.7 wide."""
    return [(x * CLUMP_SPACING + rng.uniform(-0.04, 0.04), y * CLUMP_SPACING + rng.uniform(-0.04, 0.04)) for x in (-1, 0, 1) for y in (-1, 0, 1)]


def tilted(ob, at, lean, yaw):
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def stalk(name, at, height, width, lean, yaw, color, ear=None):
    """A thin spike leaning by `lean` degrees towards `yaw`, topped by an ear when `ear` is a color name."""
    parts = [tilted(lpm.prism(name, 3, width, height, color=P[color], radius_top=0.0 if ear is None else width * 0.7), at, lean, yaw)]
    if ear:
        grain = lpm.lathe(f"{name}_ear", [(0.004, 0), (width * 1.8, 0.045), (0.003, 0.125)], segments=3, at=(0, 0, height - 0.06), color=P[ear])
        parts.append(tilted(grain, at, lean, yaw))
    return parts


def patch(rng, stalks_per_clump, height, width, lean, colors, ear=None, ear_from=None):
    parts = []
    for c, (cx, cy) in enumerate(clumps(rng)):
        for k in range(stalks_per_clump):
            a = 2 * math.pi * k / stalks_per_clump + rng.uniform(-0.5, 0.5)
            r = rng.uniform(0.0, 0.06)
            parts += stalk(f"s{c}_{k}", (cx + r * math.cos(a), cy + r * math.sin(a), 0), height * rng.uniform(0.8, 1.0), width,
                           rng.uniform(*lean), math.degrees(a), rng.choice(colors), ear)
    return parts


def stage_1(rng):
    return patch(rng, 3, 0.12, 0.016, (8, 24), ("sprout", "leaf"))


def stage_2(rng):
    return patch(rng, 4, 0.3, 0.02, (6, 20), ("leaf", "leaf_dark", "sprout"))


def stage_3(rng):
    return patch(rng, 3, 0.55, 0.018, (3, 10), ("stalk_green", "leaf", "stalk_green"))


def stage_4(rng):
    return patch(rng, 3, 0.72, 0.017, (3, 11), ("gold", "straw", "gold"), ear="gold_dark")


def crop(rng):
    """A tied sheaf: stalks cross at the twine and flare out at the ears."""
    length, tilt, base = 0.4, 30, 0.11
    parts = []
    for k in range(12):
        a = 2 * math.pi * k / 12
        parts += stalk(f"sheaf{k}", (base * math.cos(a), base * math.sin(a), 0), length, 0.016, tilt + rng.uniform(-3, 3), math.degrees(a) + 180, "gold" if k % 2 else "straw", ear="gold_dark")
    parts.append(lpm.prism("twine", 8, 0.052, 0.03, at=(0, 0, 0.155), color=P["twine"]))
    return parts


MODELS = {"wheat-1": stage_1, "wheat-2": stage_2, "wheat-3": stage_3, "wheat-4": stage_4, "wheat-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 700, OUT_DIR)
