import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("stem", "#5aa03c", 0.0, 0.9), ("leaf", "#4a9a3a", 0.0, 0.9), ("leaf_dark", "#3a8031", 0.0, 0.9),
    ("red", "#e04848", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7), ("purple", "#9b5cd6", 0.0, 0.7), ("pink", "#ff8fb8", 0.0, 0.7),
    ("heart", "#f2b02c", 0.0, 0.7), ("heart_dark", "#8a5a2b", 0.0, 0.8), ("ribbon", "#d14d72", 0.0, 0.8),
])

COLORS = ("red", "yellow", "purple", "pink")
LAYOUT = [(-0.25, -0.2), (0.0, -0.28), (0.25, -0.18), (-0.28, 0.05), (0.05, -0.02), (0.27, 0.1), (-0.12, 0.25), (0.18, 0.27)]


def blade(name, length, width, lean, yaw, color, flat=1.0, at=(0, 0, 0)):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def bloom(name, height, color, bud):
    """The head of a flower at the top of a stem built along +Z from the origin."""
    if bud:
        sepal = lpm.prism(f"{name}_bud", 5, 0.036, 0.07, at=(0, 0, height), color=P[color], radius_top=0.012)
        return [sepal, lpm.prism(f"{name}_calyx", 5, 0.04, 0.025, at=(0, 0, height - 0.005), color=P["leaf"], radius_top=0.02)]
    heart = lpm.prism(f"{name}_heart", 6, 0.032, 0.024, at=(0, 0, height), color=P["heart_dark" if color == "yellow" else "heart"], radius_top=0.024)
    petals = [blade(f"{name}_p{k}", 0.09, 0.047, 72, 360 * k / 6, color, 0.35, at=(0, 0, height + 0.005)) for k in range(6)]
    return [heart] + petals


def flower(rng, name, at, height, color, lean=0.0, yaw=0.0, bud=False, bloomed=True, leaves=2):
    parts = [lpm.prism(f"{name}_stem", 4, 0.014, height, color=P["stem"], radius_top=0.01)]
    for k in range(leaves):
        parts.append(blade(f"{name}_leaf{k}", 0.11, 0.04, 50, 180 * k + rng.uniform(-30, 30), "leaf" if k % 2 else "leaf_dark", 0.3, at=(0, 0, height * (0.25 + 0.15 * k))))
    if bloomed:
        parts += bloom(name, height, color, bud)
    for ob in parts:
        lpm.rotate(ob, lean, "Y")
        lpm.rotate(ob, yaw, "Z")
        lpm.move(ob, *at)
    return parts


def field(rng, height, bud=False, bloomed=True, leaves=2):
    parts = []
    for k, (x, y) in enumerate(LAYOUT):
        parts += flower(rng, f"f{k}", (x + rng.uniform(-0.02, 0.02), y + rng.uniform(-0.02, 0.02), 0), height * rng.uniform(0.85, 1.15), COLORS[k % 4], rng.uniform(0, 8), rng.uniform(0, 360), bud, bloomed, leaves)
    return parts


def stage_1(rng):
    parts = []
    for k, (x, y) in enumerate(LAYOUT):
        for j in range(2):
            parts.append(blade(f"s{k}_{j}", 0.05, 0.016, 20 + 10 * j, 180 * j + rng.uniform(-30, 30), "sprout", 0.35, at=(x, y, 0)))
    return parts


def stage_2(rng):
    return field(rng, 0.14, bloomed=False, leaves=3)


def stage_3(rng):
    return field(rng, 0.28, bud=True)


def stage_4(rng):
    return field(rng, 0.36)


def harvested(rng):
    return field(rng, 0.1, bloomed=False, leaves=3)


def crop(rng):
    parts = []
    for k in range(6):
        a = 360 * k / 6
        rad = math.radians(a)
        parts += flower(rng, f"b{k}", (0.1 * math.cos(rad), 0.1 * math.sin(rad), 0), 0.34, COLORS[k % 4], 36, a + 180, False, True, 0)
    parts.append(lpm.prism("ribbon", 8, 0.055, 0.035, at=(0, 0, 0.1), color=P["ribbon"]))
    return parts


MODELS = {"flower-1": stage_1, "flower-2": stage_2, "flower-3": stage_3, "flower-4": stage_4, "flowers-harvested": harvested, "flowers-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
