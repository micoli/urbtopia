import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("bush", "#4f9a46", 0.0, 0.9), ("bush_dark", "#3a7f3a", 0.0, 0.9), ("bush_light", "#72b84d", 0.0, 0.9),
    ("berry", "#3d5fd1", 0.0, 0.5), ("berry_dark", "#2a3f9a", 0.0, 0.5), ("berry_green", "#9bc45a", 0.0, 0.6),
    ("blossom", "#fff4f0", 0.0, 0.8), ("dry", "#a8a05a", 0.0, 0.9),
])

SPOTS = [(-0.2, -0.14), (0.2, -0.1), (0.0, 0.22)]


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def radius_at(z, radius, height):
    """Horizontal radius of the bush dome at height z."""
    points = [(0.0, radius), (height * 0.35, radius), (height * 0.75, radius * 0.75), (height * 0.95, radius * 0.35), (height, 0.0)]
    for (z0, r0), (z1, r1) in zip(points, points[1:]):
        if z0 <= z <= z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return 0.0


def berry(name, at, size, color):
    profile = [(0.005, 0), (0.04 * size, 0.045 * size), (0.005, 0.085 * size)]
    return lpm.lathe(name, profile, segments=5, at=at, color=P[color])


def bush(rng, name, at, radius, height, berries=0, berry_color="berry", blossoms=0, dry=False):
    x, y, _ = at
    profile = [(0.005, 0), (radius, 0.0), (radius, height * 0.35), (radius * 0.75, height * 0.75), (radius * 0.35, height * 0.95), (0.005, height)]
    body = lpm.lathe(f"{name}_body", profile, segments=6, at=(x, y, 0), color=P["bush_dark"])
    lpm.paint(body, P["bush"], lambda c, n, i: n.z > 0.2)
    parts = [body]
    for k in range(6):
        yaw = 360 * k / 6 + rng.uniform(-15, 15)
        z = height * rng.uniform(0.35, 0.8)
        r = radius_at(z, radius, height)
        parts.append(blade(f"{name}_leaf{k}", (x + r * math.cos(math.radians(yaw)), y + r * math.sin(math.radians(yaw)), z), radius * 0.9, 0.04, 55, yaw, ("bush", "bush_light", "bush_dark")[k % 3], 0.3))
    for k in range(berries):
        a = 2 * math.pi * k / berries + rng.uniform(-0.3, 0.3)
        z = height * rng.uniform(0.3, 0.78)
        r = radius_at(z, radius, height) * 1.02
        parts.append(berry(f"{name}_berry{k}", (x + r * math.cos(a), y + r * math.sin(a), z - 0.03), 1.5 if berry_color == "berry" else 1.1, berry_color if k % 3 else ("berry_dark" if berry_color == "berry" else berry_color)))
    for k in range(blossoms):
        a = rng.uniform(0, 2 * math.pi)
        z = height * rng.uniform(0.5, 0.85)
        r = radius_at(z, radius, height)
        parts.append(lpm.prism(f"{name}_blossom{k}", 5, 0.025, 0.012, at=(x + r * math.cos(a), y + r * math.sin(a), z), color=P["blossom"]))
    return parts


def field(rng, radius, height, **kwargs):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        parts += bush(rng, f"b{k}", (px + rng.uniform(-0.02, 0.02), py + rng.uniform(-0.02, 0.02), 0), radius * rng.uniform(0.9, 1.05), height * rng.uniform(0.9, 1.1), **kwargs)
    return parts


def stage_1(rng):
    parts = []
    for k, (x, y) in enumerate(SPOTS):
        for j in range(3):
            parts.append(blade(f"s{k}_{j}", (x, y, 0), 0.06, 0.02, 30 + 8 * j, 120 * j + rng.uniform(-20, 20), "sprout", 0.4))
    return parts


def stage_2(rng):
    return field(rng, 0.09, 0.11)


def stage_3(rng):
    return field(rng, 0.14, 0.2, berries=3, berry_color="berry_green", blossoms=2)


def stage_4(rng):
    return field(rng, 0.17, 0.25, berries=6)


def harvested(rng):
    return field(rng, 0.16, 0.23)


def crop(rng):
    parts = []
    ring = [(0.1 * math.cos(2 * math.pi * k / 6), 0.1 * math.sin(2 * math.pi * k / 6), 0) for k in range(6)]
    for k, (x, y, z) in enumerate(ring):
        parts.append(berry(f"r{k}", (x, y, z), 1.5, "berry" if k % 2 else "berry_dark"))
    parts.append(berry("top", (0, 0, 0.07), 1.6, "berry"))
    parts.append(berry("mid", (0, 0, 0), 1.5, "berry_dark"))
    return parts


MODELS = {"bushberries-1": stage_1, "bushberries-2": stage_2, "bushberries-3": stage_3, "bushberries-4": stage_4, "bushberries-harvested": harvested, "bushberries-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 800, OUT_DIR)
