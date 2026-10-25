import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import item_lib  # noqa: E402
from item_lib import color, lpm  # noqa: E402

K = 1.5


def part(name, size, at, body, taper=(1.0, 1.0)):
    x, y, z = at
    return lpm.box(name, tuple(v * K for v in size), at=(x * K, y * K, z * K), color=color(body), taper=taper)


def legs(width, length, lift, body="coal", size=0.022):
    return [part(f"leg_{x}_{y}", (size, size, lift - 0.01), (x, y, 0.012), body) for x in (-width / 2 + 0.02, width / 2 - 0.02) for y in (-length / 2 + 0.03, length / 2 - 0.03)]


def cow():
    length, width, height, lift = 0.2, 0.11, 0.1, 0.055
    parts = [part("body", (width, length, height), (0, 0, lift), "white", taper=(0.92, 0.95)), part("patch", (width + 0.004, 0.07, height * 0.5), (0, 0.02, lift + height * 0.4), "coal")]
    parts += legs(width, length, lift)
    parts += [part("head", (0.07, 0.07, 0.07), (0, -length / 2 - 0.025, lift + height - 0.055), "white"), part("muzzle", (0.05, 0.02, 0.03), (0, -length / 2 - 0.07, lift + height - 0.055), "clay")]
    parts += [part(f"horn_{side}", (0.012, 0.012, 0.03), (side * 0.032, -length / 2 - 0.02, lift + height + 0.01), "gold") for side in (-1, 1)]
    return parts


def sheep():
    length, width, height, lift = 0.16, 0.12, 0.1, 0.05
    parts = [part("body", (width, length, height), (0, 0, lift), "wool", taper=(0.9, 0.92)), part("fleece", (width + 0.01, length - 0.04, 0.04), (0, 0.0, lift + height - 0.01), "wool")]
    parts += legs(width, length, lift)
    parts += [part("head", (0.06, 0.065, 0.065), (0, -length / 2 - 0.025, lift + height - 0.05), "coal")]
    return parts


def goat():
    length, width, height, lift = 0.15, 0.07, 0.075, 0.055
    parts = [part("body", (width, length, height), (0, 0, lift), "sand_dark", taper=(0.92, 0.95))]
    parts += legs(width, length, lift, "wood_dark")
    parts += [part("head", (0.05, 0.065, 0.06), (0, -length / 2 - 0.025, lift + height - 0.04), "sand_dark"), part("beard", (0.015, 0.015, 0.03), (0, -length / 2 - 0.05, lift + height - 0.075), "white")]
    parts += [part(f"horn_{side}", (0.01, 0.01, 0.035), (side * 0.015, -length / 2 - 0.03, lift + height + 0.01), "coal") for side in (-1, 1)]
    return parts


def alpaca():
    length, width, height, lift = 0.15, 0.09, 0.09, 0.07
    parts = [part("body", (width, length, height), (0, 0, lift), "alpaca", taper=(0.9, 0.92)), part("fleece", (width + 0.01, length - 0.03, 0.035), (0, 0.0, lift + height - 0.01), "alpaca_light")]
    parts += legs(width, length, lift, "alpaca")
    parts += [
        part("neck", (0.04, 0.04, 0.11), (0, -length / 2 + 0.005, lift + height - 0.02), "alpaca_light"),
        part("head", (0.05, 0.06, 0.05), (0, -length / 2 - 0.02, lift + height + 0.08), "alpaca_light"),
        part("ear_a", (0.012, 0.012, 0.025), (-0.015, -length / 2 - 0.005, lift + height + 0.125), "alpaca"),
        part("ear_b", (0.012, 0.012, 0.025), (0.015, -length / 2 - 0.005, lift + height + 0.125), "alpaca"),
    ]
    return parts


def hen():
    parts = [part("body", (0.075, 0.1, 0.07), (0, 0, 0.02), "white", taper=(0.9, 0.9)), part("tail", (0.03, 0.03, 0.05), (0, 0.04, 0.07), "white"), part("head", (0.045, 0.045, 0.05), (0, -0.06, 0.07), "white"), part("beak", (0.025, 0.025, 0.014), (0, -0.09, 0.09), "gold"), part("comb", (0.01, 0.025, 0.02), (0, -0.06, 0.12), "red")]
    parts += [part(f"foot_{side}", (0.012, 0.02, 0.02), (side * 0.016, -0.01, 0.0), "sand_dark") for side in (-1, 1)]
    return parts


def duck():
    parts = [part("body", (0.07, 0.11, 0.06), (0, 0, 0.02), "gold", taper=(0.9, 0.9)), part("tail", (0.03, 0.03, 0.05), (0, 0.045, 0.055), "gold"), part("head", (0.045, 0.045, 0.05), (0, -0.065, 0.07), "gold"), part("beak", (0.03, 0.03, 0.014), (0, -0.095, 0.09), "red")]
    parts += [part(f"foot_{side}", (0.012, 0.02, 0.02), (side * 0.016, -0.01, 0.0), "red") for side in (-1, 1)]
    return parts


def silkworm():
    parts = [part("tray", (0.3, 0.22, 0.04), (0, 0, 0.0), "wood"), part("tray_inner", (0.27, 0.19, 0.02), (0, 0, 0.03), "wood_dark")]
    for index, (x, y, yaw) in enumerate(((-0.07, -0.03, 20), (0.06, 0.03, -30), (0.0, -0.01, 70))):
        leaf = lpm.sweep(f"leaf{index}", [(0, 0), (0.07, 0.045), (0.16, 0), (0.07, -0.045)], 0.006, at=(x * K - 0.08 * K, y * K, 0.05 * K + index * 0.002), color=color("leaf_green"), axis="z")
        lpm.rotate(leaf, yaw, "Z", about=(x * K, y * K, 0))
        parts.append(leaf)
    for index, (x, y) in enumerate(((-0.08, 0.05), (-0.03, 0.06), (0.08, -0.05), (0.03, -0.065), (0.1, 0.04))):
        parts.append(part(f"worm_{index}", (0.016, 0.05, 0.016), (x, y, 0.062), "silk", taper=(0.8, 0.8)))
    for index, (x, y) in enumerate(((-0.1, -0.05), (0.0, 0.065))):
        cocoon = lpm.lathe(f"cocoon{index}", [(0, 0), (0.02, 0.003), (0.032, 0.025), (0.033, 0.05), (0.022, 0.07), (0.008, 0.082), (0, 0.085)], segments=7, at=(x * K, y * K, 0.05 * K), color=color("silk"))
        lpm.rotate(cocoon, 75, "Y", about=(x * K, y * K, 0.05 * K))
        parts.append(cocoon)
    return parts


MODELS = {"cow": cow, "sheep": sheep, "goat": goat, "alpaca": alpaca, "hen": hen, "duck": duck, "silkworm": silkworm}

out_dir = os.path.dirname(os.path.abspath(__file__))
only = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
for model_id, make_parts in MODELS.items():
    if only and model_id not in only:
        continue
    item_lib.build(model_id, make_parts, out_dir)
