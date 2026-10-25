import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("outer", "#5fae3f", 0.0, 0.9), ("mid", "#7cc54a", 0.0, 0.9), ("inner", "#a6dc62", 0.0, 0.9), ("heart", "#b8e472", 0.0, 0.9),
    ("sprout", "#9fd85a", 0.0, 0.9), ("dry", "#b9b366", 0.0, 0.9), ("dry_dark", "#968f4c", 0.0, 0.9), ("stump", "#d9dca0", 0.0, 0.9),
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


def head(rng, name, at, rings, dome=0.0):
    """Rings of broad leaves, outermost first: (count, length, width, lean, color); an optional dome closes the heart."""
    x, y, z = at
    parts = []
    for r, (count, length, width, lean, color) in enumerate(rings):
        offset = rng.uniform(0, 360)
        for k in range(count):
            parts.append(blade(f"{name}_r{r}_{k}", (x, y, z + 0.01 * r), length * rng.uniform(0.9, 1.05), width, lean + rng.uniform(-6, 6), offset + 360 * k / count + rng.uniform(-10, 10), color, 0.3))
    if dome:
        profile = [(0.005, 0), (dome, 0.02), (dome * 0.95, dome * 0.6), (dome * 0.55, dome * 1.0), (0.005, dome * 1.1)]
        parts.append(lpm.lathe(f"{name}_dome", profile, segments=7, at=(x, y, z + 0.02), color=P["heart"]))
    return parts


def field(rng, rings, dome=0.0):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        parts += head(rng, f"h{k}", (px + rng.uniform(-0.02, 0.02), py + rng.uniform(-0.02, 0.02), 0), rings, dome)
    return parts


def stage_1(rng):
    return field(rng, [(4, 0.07, 0.035, 35, "sprout")])


def stage_2(rng):
    return field(rng, [(5, 0.12, 0.06, 62, "outer"), (4, 0.1, 0.05, 40, "mid")])


def stage_3(rng):
    return field(rng, [(6, 0.17, 0.07, 66, "outer"), (5, 0.14, 0.06, 45, "mid"), (4, 0.1, 0.05, 25, "inner")])


def stage_4(rng):
    return field(rng, [(6, 0.19, 0.075, 62, "outer"), (5, 0.16, 0.065, 42, "mid"), (4, 0.12, 0.055, 22, "inner")], dome=0.11)


def harvested(rng):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        parts.append(lpm.prism(f"h{k}_stump", 6, 0.035, 0.045, at=(px, py, 0), color=P["stump"], radius_top=0.028))
        parts += [blade(f"h{k}_l{j}", (px, py, 0.01), 0.16, 0.06, 82, 90 * j + rng.uniform(-25, 25), "dry" if j % 2 else "dry_dark", 0.3) for j in range(4)]
    return parts


def crop(rng):
    return head(rng, "c", (0, 0, 0), [(7, 0.23, 0.1, 64, "outer"), (6, 0.2, 0.085, 44, "mid"), (5, 0.16, 0.07, 24, "inner")], dome=0.17)


MODELS = {"lettuce-1": stage_1, "lettuce-2": stage_2, "lettuce-3": stage_3, "lettuce-4": stage_4, "lettuce-harvested": harvested, "lettuce-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
