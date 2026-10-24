import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("leaf", "#5a9a3a", 0.0, 0.9), ("leaf_dark", "#44822f", 0.0, 0.9), ("leaf_light", "#74b248", 0.0, 0.9),
    ("vine", "#6a9a3c", 0.0, 0.9), ("stem", "#6b7a30", 0.0, 0.9),
    ("pumpkin", "#f08a24", 0.0, 0.7), ("pumpkin_dark", "#d9701a", 0.0, 0.7), ("pumpkin_light", "#ffa645", 0.0, 0.7),
    ("green_pumpkin", "#9bc45a", 0.0, 0.7), ("green_dark", "#7aa843", 0.0, 0.7), ("flower", "#ffd23a", 0.0, 0.8),
    ("dry", "#bfa65a", 0.0, 0.9), ("dry_dark", "#9a8446", 0.0, 0.9),
])

SPOTS = [(-0.2, -0.16), (0.2, -0.12), (0.0, 0.21)]


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def leaf(rng, name, at, yaw, radius, colors):
    """A round leaf on a short stalk, tilted a little."""
    x, y, z = at
    reach = 0.1
    tip = (x + reach * 0.57 * math.cos(math.radians(yaw)), y + reach * 0.57 * math.sin(math.radians(yaw)), z + reach * 0.82)
    disc = lpm.prism(f"{name}_disc", 6, radius, 0.008, color=P[rng.choice(colors)])
    lpm.rotate(disc, rng.uniform(8, 22), "Y")
    lpm.rotate(disc, yaw, "Z")
    lpm.move(disc, *tip)
    return [blade(f"{name}_stalk", at, reach, 0.01, 35, yaw, "stem"), disc]


def pumpkin(name, at, size, colors, rng):
    x, y, z = at
    profile = [(0.005, 0), (0.09 * size, 0.01 * size), (0.14 * size, 0.05 * size), (0.15 * size, 0.11 * size), (0.12 * size, 0.17 * size), (0.04 * size, 0.2 * size), (0.005, 0.19 * size)]
    body = lpm.lathe(f"{name}_body", profile, segments=8, at=(x, y, z), color=P[colors[0]])
    lpm.paint(body, P[colors[1]], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.8)
    stem = lpm.prism(f"{name}_stem", 5, 0.02 * size, 0.07 * size, at=(x, y, z + 0.18 * size), color=P["stem"], radius_top=0.012 * size)
    lpm.rotate(stem, rng.uniform(5, 15), "Y", about=(x, y, z + 0.18 * size))
    return [body, stem]


def plant(rng, name, at, leaves, vines, size=0.0, ripe=True, flowers=0, dry=False):
    x, y, _ = at
    colors = ("dry", "dry_dark") if dry else ("leaf", "leaf_dark", "leaf_light")
    vine_color = "dry_dark" if dry else "vine"
    parts = []
    for k in range(vines):
        yaw = 360 * k / vines + rng.uniform(-30, 30)
        length = rng.uniform(0.1, 0.15)
        parts.append(blade(f"{name}_v{k}", (x, y, 0.01), length, 0.012, 78, yaw, vine_color))
        parts.append(blade(f"{name}_w{k}", (x + length * 0.98 * math.cos(math.radians(yaw)), y + length * 0.98 * math.sin(math.radians(yaw)), 0.04), 0.07, 0.01, 70, yaw + 35, vine_color))
    for k in range(leaves):
        yaw = 360 * k / leaves + rng.uniform(-20, 20)
        r = rng.uniform(0.05, 0.08)
        parts += leaf(rng, f"{name}_l{k}", (x + 0.03 * math.cos(math.radians(yaw)), y + 0.03 * math.sin(math.radians(yaw)), 0.02), yaw, r, colors)
    for k in range(flowers):
        a = rng.uniform(0, 2 * math.pi)
        parts.append(lpm.prism(f"{name}_flower{k}", 5, 0.035, 0.04, at=(x + 0.12 * math.cos(a), y + 0.12 * math.sin(a), 0.02), color=P["flower"], radius_top=0.05))
    if size:
        colors_p = ("pumpkin", "pumpkin_dark") if ripe else ("green_pumpkin", "green_dark")
        parts += pumpkin(f"{name}_fruit", (x + 0.06, y - 0.04, 0.0), size, colors_p, rng)
    return parts


def field(rng, **kwargs):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        parts += plant(rng, f"p{k}", (px + rng.uniform(-0.02, 0.02), py + rng.uniform(-0.02, 0.02), 0), **kwargs)
    return parts


def stage_1(rng):
    parts = []
    for k, (px, py) in enumerate(SPOTS):
        for j in range(2):
            parts.append(blade(f"s{k}_{j}", (px, py, 0), 0.07, 0.03, 50, 180 * j + rng.uniform(-30, 30), "sprout" if j else "leaf_light", 0.3))
    return parts


def stage_2(rng):
    return field(rng, leaves=3, vines=2)


def stage_3(rng):
    return field(rng, leaves=4, vines=3, size=0.5, ripe=False, flowers=1)


def stage_4(rng):
    return field(rng, leaves=4, vines=3, size=1.0)


def harvested(rng):
    return field(rng, leaves=3, vines=3, dry=True)


def crop(rng):
    return pumpkin("c", (0, 0, 0), 1.15, ("pumpkin", "pumpkin_dark"), rng)


MODELS = {"pumpkin-1": stage_1, "pumpkin-2": stage_2, "pumpkin-3": stage_3, "pumpkin-4": stage_4, "pumpkin-harvested": harvested, "pumpkin-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 900, OUT_DIR)
