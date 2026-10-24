import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm  # noqa: E402

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

P = lpm.Palette([
    ("sprout", "#9fd85a", 0.0, 0.9), ("stem", "#6fae3c", 0.0, 0.9), ("leaf", "#5aa23a", 0.0, 0.9),
    ("leaf_dark", "#468a30", 0.0, 0.9), ("leaf_light", "#8cc850", 0.0, 0.9),
    ("husk", "#9cc85a", 0.0, 0.9), ("husk_dry", "#d9d08a", 0.0, 0.9),
    ("kernel", "#f4c93a", 0.0, 0.7), ("kernel_dark", "#e0a820", 0.0, 0.7),
    ("tassel", "#e8d890", 0.0, 0.9), ("dry", "#c9a86a", 0.0, 0.9), ("dry_dark", "#a88850", 0.0, 0.9),
])

PLANT_SPOTS = [(0.0, 0.0), (-0.18, -0.18), (0.18, -0.18), (-0.18, 0.18), (0.18, 0.18)]


def tilted(ob, at, lean, yaw):
    lpm.rotate(ob, lean, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def blade(name, at, length, width, lean, yaw, color, flat=1.0):
    """A pointed spike; `flat` below 1 squashes it into a leaf blade."""
    ob = lpm.prism(name, 3, width, length, color=P[color], radius_top=0.0)
    if flat < 1.0:
        for v in ob.data.vertices:
            v.co.y *= flat
        ob.data.update()
    return tilted(ob, at, lean, yaw)


def leaf(name, base, length, yaw, color):
    """A leaf that rises from the stalk then droops at its tip."""
    first = length * 0.6
    reach = (first * math.sin(math.radians(30)) * math.cos(math.radians(yaw)), first * math.sin(math.radians(30)) * math.sin(math.radians(yaw)), first * math.cos(math.radians(30)))
    tip = (base[0] + reach[0], base[1] + reach[1], base[2] + reach[2])
    return [blade(f"{name}_a", base, first, 0.04, 30, yaw, color, 0.25), blade(f"{name}_b", tip, length * 0.5, 0.04, 110, yaw, color, 0.25)]


def plant(rng, name, at, height, leaves, tassel=False, cobs=0, ripe=False):
    x, y, z = at
    stalk = lpm.prism(f"{name}_stalk", 6, 0.022, height, at=(x, y, z), color=P["stem"], radius_top=0.014)
    parts = [stalk]
    for k in range(leaves):
        fraction = 0.2 + 0.7 * k / max(1, leaves - 1) if leaves > 1 else 0.3
        yaw = 180 * k + rng.uniform(-25, 25)
        parts += leaf(f"{name}_l{k}", (x, y, z + height * fraction), height * 0.42 * (1.15 - 0.4 * fraction), yaw, ("leaf", "leaf_dark")[k % 2])
    if tassel:
        for k in range(3):
            parts.append(blade(f"{name}_t{k}", (x, y, z + height * 0.97), 0.12, 0.012, 22, 120 * k + rng.uniform(-15, 15), "tassel"))
    for k in range(cobs):
        yaw = 140 + 170 * k + rng.uniform(-20, 20)
        base = (x, y, z + height * (0.5 + 0.1 * k))
        husk = blade(f"{name}_husk{k}", base, 0.26, 0.06, 28, yaw, "husk_dry" if ripe else "husk")
        top = (base[0] + 0.26 * math.sin(math.radians(28)) * math.cos(math.radians(yaw)), base[1] + 0.26 * math.sin(math.radians(28)) * math.sin(math.radians(yaw)), base[2] + 0.26 * math.cos(math.radians(28)))
        parts += [husk, blade(f"{name}_kernel{k}", (top[0] - 0.03 * math.sin(math.radians(28)) * math.cos(math.radians(yaw)), top[1] - 0.03 * math.sin(math.radians(28)) * math.sin(math.radians(yaw)), top[2] - 0.03), 0.1, 0.034, 28, yaw, "kernel")]
    return parts


def field(rng, **kwargs):
    parts = []
    for k, (px, py) in enumerate(PLANT_SPOTS):
        parts += plant(rng, f"p{k}", (px + rng.uniform(-0.03, 0.03), py + rng.uniform(-0.03, 0.03), 0), **kwargs)
    return parts


def stage_1(rng):
    parts = []
    for k, (px, py) in enumerate(PLANT_SPOTS):
        for j in range(3):
            parts.append(blade(f"s{k}_{j}", (px, py, 0), 0.11 + 0.02 * j, 0.016, 15 + 8 * j, 120 * j + rng.uniform(-20, 20), "sprout" if j else "leaf_light", 0.4))
    return parts


def stage_2(rng):
    return field(rng, height=0.2, leaves=4)


def stage_3(rng):
    return field(rng, height=0.7, leaves=6, tassel=True)


def stage_4(rng):
    return field(rng, height=0.9, leaves=6, tassel=True, cobs=2, ripe=True)


def harvested(rng):
    parts = []
    for k, (px, py) in enumerate(PLANT_SPOTS):
        px += rng.uniform(-0.03, 0.03)
        py += rng.uniform(-0.03, 0.03)
        parts.append(lpm.prism(f"h{k}_stub", 6, 0.024, 0.2, at=(px, py, 0), color=P["dry"], radius_top=0.018))
        parts += [blade(f"h{k}_l{j}", (px, py, 0.1 + 0.05 * j), 0.18, 0.04, 75, 180 * j + rng.uniform(-30, 30), "dry_dark", 0.25) for j in range(2)]
    return parts


def cob(name, at, yaw):
    body = lpm.lathe(f"{name}_cob", [(0.004, 0), (0.042, 0.04), (0.046, 0.18), (0.03, 0.27), (0.004, 0.3)], segments=6, at=(0, 0, -0.15), color=P["kernel"])
    husk = lpm.lathe(f"{name}_husk", [(0.05, 0.0), (0.058, 0.06), (0.05, 0.14), (0.004, 0.17)], segments=6, at=(0, 0, -0.15), color=P["husk"])
    parts = []
    for ob in (body, husk):
        lpm.rotate(ob, 90, "Y")
        lpm.rotate(ob, yaw, "Z")
        lpm.move(ob, at[0], at[1], at[2] + 0.06)
        parts.append(ob)
    return parts


def crop(rng):
    return cob("a", (0.0, -0.07, 0), 15) + cob("b", (0.0, 0.07, 0.06), -12)


MODELS = {"corn-1": stage_1, "corn-2": stage_2, "corn-3": stage_3, "corn-4": stage_4, "corn-harvested": harvested, "corn-crop": crop}

if __name__ == "__main__":
    model_lib.export_all(MODELS, P, 900, OUT_DIR)
