import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("cactus", "#5f9a4a", 0.0, 0.8), ("cactus_dark", "#4a7f3a", 0.0, 0.8), ("cactus_light", "#7cb85e", 0.0, 0.8),
    ("flower", "#ff6fa8", 0.0, 0.7), ("heart", "#ffd23a", 0.0, 0.7),
    ("fruit", "#e0407a", 0.0, 0.7), ("fruit_dark", "#b82a62", 0.0, 0.7), ("spine", "#f1e6c8", 0.0, 0.9),
])

SPOTS = [(-0.2, -0.12), (0.2, -0.08), (0.0, 0.22)]


def ribbed(ob):
    lpm.paint(ob, P["cactus_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.6)
    lpm.paint(ob, P["cactus_light"], lambda c, n, i: n.z > 0.7)
    return ob


def trunk(name, at, height, radius):
    x, y, _ = at
    profile = [(0.005, 0), (radius, 0.02), (radius * 1.02, height - 0.06), (radius * 0.6, height - 0.01), (0.005, height + 0.015)]
    return ribbed(lpm.lathe(name, profile, segments=6, at=(x, y, 0), color=P["cactus"]))


def bloom(name, at, size=1.0):
    x, y, z = at
    parts = [lpm.prism(f"{name}_heart", 5, 0.018 * size, 0.012, at=(x, y, z), color=P["heart"])]
    for k in range(5):
        petal = lpm.prism(f"{name}_p{k}", 3, 0.026 * size, 0.05 * size, color=P["flower"], radius_top=0.0)
        for v in petal.data.vertices:
            v.co.y *= 0.4
        petal.data.update()
        lpm.rotate(petal, 60, "Y")
        lpm.rotate(petal, 72 * k, "Z")
        parts.append(lpm.move(petal, x, y, z))
    return parts


def arm(name, at, z, yaw, up, radius):
    """A side arm: a short horizontal piece then a vertical one."""
    x, y, _ = at
    reach = radius + 0.07
    out = lpm.prism(f"{name}_out", 6, radius * 0.6, reach, color=P["cactus"])
    lpm.rotate(out, 90, "Y")
    lpm.rotate(out, yaw, "Z")
    lpm.move(out, x, y, z)
    cx, cy = x + math.cos(math.radians(yaw)) * reach, y + math.sin(math.radians(yaw)) * reach
    rise = ribbed(lpm.prism(f"{name}_up", 6, radius * 0.6, up, at=(cx, cy, z - radius * 0.6), color=P["cactus"], radius_top=radius * 0.48))
    return [ribbed(out), rise], (cx, cy, z - radius * 0.6 + up)


def cactus(rng, name, at, height, radius, arms=(), flowers=False):
    parts = [trunk(f"{name}_trunk", at, height, radius)]
    x, y, _ = at
    if flowers:
        parts += bloom(f"{name}_top", (x, y, height + 0.012))
    for k, (fraction, yaw, up) in enumerate(arms):
        more, tip = arm(f"{name}_arm{k}", at, height * fraction, yaw, up, radius)
        parts += more
        if flowers:
            parts += bloom(f"{name}_arm{k}_bloom", (tip[0], tip[1], tip[2] + 0.005), 0.8)
    return parts


def field(rng, heights, radius, arms=(), flowers=False):
    parts = []
    for k, ((x, y), height) in enumerate(zip(SPOTS, heights)):
        sides = [(f, 0 if k % 2 == 0 else 180, u) for f, _, u in arms]
        if len(sides) > 1:
            sides[1] = (sides[1][0], sides[1][1] + 180, sides[1][2])
        parts += cactus(rng, f"c{k}", (x + rng.uniform(-0.02, 0.02), y + rng.uniform(-0.02, 0.02), 0), height, radius, sides, flowers)
    return parts


def stage_1(rng):
    parts = []
    for k, (x, y) in enumerate(SPOTS):
        parts.append(ribbed(lpm.lathe(f"b{k}", [(0.005, 0), (0.05, 0.015), (0.045, 0.045), (0.005, 0.065)], segments=6, at=(x, y, 0), color=P["cactus"])))
    return parts


def stage_2(rng):
    return field(rng, (0.14, 0.12, 0.16), 0.045)


def stage_3(rng):
    return field(rng, (0.3, 0.24, 0.28), 0.06)


def stage_4(rng):
    return field(rng, (0.5, 0.4, 0.45), 0.07, arms=((0.55, 0, 0.14), (0.4, 0, 0.1)), flowers=True)


def harvested(rng):
    return field(rng, (0.45, 0.36, 0.4), 0.07, arms=((0.55, 0, 0.12), (0.4, 0, 0.08)))


def fruit(name, at):
    x, y, z = at
    profile = [(0.005, 0), (0.05, 0.02), (0.065, 0.07), (0.05, 0.12), (0.03, 0.15), (0.005, 0.155)]
    ob = lpm.lathe(name, profile, segments=6, at=(x, y, z), color=P["fruit"])
    lpm.paint(ob, P["fruit_dark"], lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.6)
    top = lpm.prism(f"{name}_top", 6, 0.03, 0.01, at=(x, y, z + 0.15), color=P["spine"])
    return [ob, top]


def crop(rng):
    parts = []
    for k, (x, y) in enumerate(((-0.1, -0.07), (0.1, -0.05), (0.0, 0.1))):
        parts += fruit(f"f{k}", (x, y, 0))
    return parts


MODELS = {"cactus-1": stage_1, "cactus-2": stage_2, "cactus-3": stage_3, "cactus-4": stage_4, "cactus-harvested": harvested, "cactus-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
