import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#a8e063", 0.0, 0.9), ("leaf", "#4f9a46", 0.0, 0.9), ("leaf_dark", "#3a7f3a", 0.0, 0.9), ("leaf_light", "#72b84d", 0.0, 0.9),
    ("vine", "#6a9a3c", 0.0, 0.9), ("stem", "#6b7a30", 0.0, 0.9),
    ("rind", "#4fa84a", 0.0, 0.7), ("rind_dark", "#2f7a3a", 0.0, 0.7), ("rind_light", "#8ccf6a", 0.0, 0.7),
    ("young", "#9bc45a", 0.0, 0.7), ("young_dark", "#7aa843", 0.0, 0.7), ("flower", "#ffd23a", 0.0, 0.8),
    ("flesh", "#ef4a52", 0.0, 0.6), ("flesh_dark", "#d63341", 0.0, 0.6), ("white", "#f4f0dc", 0.0, 0.8), ("seed", "#2a1f1f", 0.0, 0.5),
    ("dry", "#bfa65a", 0.0, 0.9), ("dry_dark", "#9a8446", 0.0, 0.9),
])

SPOTS = [(-0.2, -0.17), (0.2, -0.13), (0.0, 0.22)]


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def leaf(rng, name, at, yaw, colors):
    """A three-lobed leaf lying nearly flat, on a short stalk."""
    x, y, z = at
    reach = 0.07
    tip = (x + reach * 0.5 * math.cos(math.radians(yaw)), y + reach * 0.5 * math.sin(math.radians(yaw)), z + reach * 0.5)
    color = rng.choice(colors)
    return [blade(f"{name}_stalk", at, reach, 0.01, 60, yaw, "stem")] + [
        blade(f"{name}_lobe{k}", tip, rng.uniform(0.09, 0.12), 0.045, 72, yaw + 38 * (k - 1), color, 0.3) for k in range(3)]


def melon(name, at, size, colors, rng, stem=True):
    x, y, z = at
    profile = [(0.005, 0), (0.06 * size, 0.01 * size), (0.1 * size, 0.04 * size), (0.115 * size, 0.1 * size), (0.1 * size, 0.16 * size), (0.055 * size, 0.2 * size), (0.005, 0.21 * size)]
    body = lpm.lathe(f"{name}_body", profile, segments=8, at=(0, 0, 0), color=P[colors[0]])
    for v in body.data.vertices:
        v.co.x *= 1.4
    body.data.update()
    lpm.paint(body, P[colors[1]], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.85)
    lpm.rotate(body, rng.uniform(-30, 30), "Z")
    lpm.move(body, x, y, z)
    parts = [body]
    if stem:
        parts.append(blade(f"{name}_stem", (x, y, z + 0.2 * size), 0.05 * size, 0.012, 15, rng.uniform(0, 360), "stem"))
    return parts


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
        parts += leaf(rng, f"{name}_l{k}", (x + 0.03 * math.cos(math.radians(yaw)), y + 0.03 * math.sin(math.radians(yaw)), 0.02), yaw, colors)
    for k in range(flowers):
        a = rng.uniform(0, 2 * math.pi)
        parts.append(lpm.prism(f"{name}_flower{k}", 5, 0.03, 0.035, at=(x + 0.11 * math.cos(a), y + 0.11 * math.sin(a), 0.02), color=P["flower"], radius_top=0.045))
    if size:
        fruit_colors = ("rind", "rind_dark") if ripe else ("young", "young_dark")
        parts += melon(f"{name}_fruit", (x + 0.05, y - 0.03, 0.0), size, fruit_colors, rng)
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
    return field(rng, leaves=4, vines=3, size=0.55, ripe=False, flowers=1)


def stage_4(rng):
    return field(rng, leaves=4, vines=3, size=1.0)


def harvested(rng):
    return field(rng, leaves=3, vines=3, dry=True)


def crop(rng):
    """A watermelon half lying cut side up: rind dome, white rim, red flesh and seeds."""
    profile = [(0.005, 0), (0.1, 0.012), (0.155, 0.055), (0.17, 0.1), (0.165, 0.12)]
    shell = lpm.lathe("rind", profile, segments=8, at=(0, 0, 0), color=P["rind"])
    lpm.paint(shell, P["rind_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.85)
    flesh = lpm.prism("flesh", 8, 0.145, 0.012, at=(0, 0, 0.115), color=P["flesh"])
    rim = lpm.prism("rim", 8, 0.162, 0.01, at=(0, 0, 0.113), color=P["white"])
    parts = [shell, rim, flesh]
    for k in range(7):
        a = 2 * math.pi * k / 7
        r = 0.07 if k % 2 else 0.1
        parts.append(lpm.box(f"seed{k}", (0.014, 0.008, 0.008), at=(r * math.cos(a), r * math.sin(a), 0.127), color=P["seed"]))
    for ob in parts:
        for v in ob.data.vertices:
            v.co.x *= 1.18
        ob.data.update()
    return parts


MODELS = {"watermelon-1": stage_1, "watermelon-2": stage_2, "watermelon-3": stage_3, "watermelon-4": stage_4, "watermelon-harvested": harvested, "watermelon-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 900, OUT_DIR)
