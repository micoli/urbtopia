import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import item_lib  # noqa: E402
from item_lib import color, lpm  # noqa: E402


def leaf(name, at, yaw, length, width, body):
    outline = [(0, 0), (length * 0.4, width / 2), (length, 0), (length * 0.4, -width / 2)]
    part = lpm.sweep(name, outline, 0.004, at=at, color=color(body), axis="z")
    lpm.rotate(part, yaw, "Z", about=at)
    return part


def spin(parts, deg, about):
    for part in parts:
        lpm.rotate(part, deg, "Z", about=about)
    return parts


def bricks():
    return [
        lpm.box("brick", (0.30, 0.15, 0.09), color=color("brick")),
        lpm.box("hole_a", (0.07, 0.04, 0.004), at=(-0.07, 0, 0.09), color=color("clay_dark")),
        lpm.box("hole_b", (0.07, 0.04, 0.004), at=(0.07, 0, 0.09), color=color("clay_dark")),
    ]


def can(prefix, x, y):
    return [
        lpm.prism(f"{prefix}body", 10, 0.08, 0.11, at=(x, y, 0), color=color("tin")),
        lpm.prism(f"{prefix}label", 10, 0.0815, 0.06, at=(x, y, 0.025), color=color("fish_blue")),
        lpm.prism(f"{prefix}lid", 10, 0.085, 0.012, at=(x, y, 0.11), color=color("tin_dark")),
        lpm.box(f"{prefix}tab", (0.03, 0.02, 0.006), at=(x, y, 0.122), color=color("label")),
    ]


def canned_fish():
    return can("a", 0.0, 0.0)


def cement():
    profile = [(0.10, 0), (0.15, 0.03), (0.16, 0.07), (0.12, 0.10), (0.07, 0.115)]
    sack = lpm.lathe("sack", profile, segments=8, color=color("cement"))
    lpm.paint(sack, color("cement_dark"), where=lambda c, n, i: i % 4 == 3)
    lpm.scale(sack, 1.35, 0.8, 1.0)
    random.seed(3)
    for vertex in sack.data.vertices:
        vertex.co.z += random.uniform(-0.006, 0.006)
        vertex.co.y += random.uniform(-0.008, 0.008)
    ears = []
    for side in (-1, 1):
        ear = lpm.box(f"ear{side}", (0.07, 0.11, 0.05), at=(side * 0.20, 0, 0.03), color=color("cement_dark"), taper=(0.5, 0.6))
        lpm.rotate(ear, side * 12, "Y", about=(side * 0.20, 0, 0.03))
        ears.append(ear)
    label = [
        lpm.box("label", (0.12, 0.07, 0.004), at=(0, 0, 0.114), color=color("paper")),
        lpm.box("stripe", (0.12, 0.016, 0.004), at=(0, 0, 0.118), color=color("label")),
    ]
    return [sack] + ears + label


def circuits():
    top = 0.02
    parts = [lpm.box("board", (0.34, 0.26, 0.02), color=color("pcb"))]
    parts.append(lpm.box("chip", (0.09, 0.09, 0.03), at=(-0.05, 0.02, top), color=color("chip")))
    parts.append(lpm.box("chipA", (0.06, 0.035, 0.016), at=(0.07, 0.07, top), color=color("chip")))
    parts.append(lpm.box("chipB", (0.06, 0.035, 0.016), at=(0.07, -0.01, top), color=color("chip")))
    parts.append(lpm.prism("cap", 8, 0.018, 0.045, at=(-0.12, -0.07, top), color=color("tin_dark")))
    parts.append(lpm.prism("cap2", 8, 0.014, 0.035, at=(-0.07, -0.08, top), color=color("tin_dark")))
    for i, x in enumerate((0.04, 0.08, 0.12)):
        parts.append(lpm.box(f"res{i}", (0.015, 0.04, 0.012), at=(x, -0.08, top), color=color("wood_light")))
    for i in range(6):
        parts.append(lpm.box(f"pad{i}", (0.02, 0.025, 0.004), at=(-0.12 + i * 0.048, -0.118, top), color=color("gold")))
    for i, (x, y, w, d) in enumerate([(-0.05, 0.09, 0.11, 0.01), (-0.11, 0.05, 0.01, 0.1), (0.07, 0.03, 0.01, 0.03), (0.0, -0.045, 0.14, 0.01)]):
        parts.append(lpm.box(f"trace{i}", (w, d, 0.003), at=(x, y, top), color=color("pcb_dark")))
    return parts


def crystal_shard(prefix, x, y, radius, height, tilt, axis):
    part = lpm.lathe(prefix, [(radius, 0), (radius, height * 0.6), (0.0, height)], segments=6, at=(x, y, 0), color=color("crystal"))
    lpm.paint(part, color("crystal_light"), where=lambda c, n, i: n.z > 0.35 and c.z > height * 0.62)
    lpm.rotate(part, tilt, axis, about=(x, y, 0))
    return part


def crystal():
    return [
        lpm.prism("rock", 7, 0.18, 0.04, color=color("stone_dark"), radius_top=0.16),
        crystal_shard("a", 0.0, 0.0, 0.06, 0.28, 0, "Z"),
        crystal_shard("b", 0.09, 0.03, 0.045, 0.19, 18, "Y"),
        crystal_shard("c", -0.09, 0.03, 0.05, 0.21, -20, "Y"),
        crystal_shard("d", 0.0, -0.09, 0.04, 0.14, -18, "X"),
        crystal_shard("e", 0.08, -0.08, 0.03, 0.10, -12, "X"),
    ]


def glass():
    parts = [lpm.box("tray", (0.36, 0.24, 0.03), color=color("wood"))]
    for i, y in enumerate((-0.07, 0.0, 0.07)):
        pane = lpm.box(f"pane{i}", (0.30, 0.02, 0.26), at=(0, y, 0.03), color=color("glass"))
        lpm.paint(pane, color("glass_edge"), where=lambda c, n, j: abs(n.y) < 0.5)
        parts.append(pane)
    return parts


def jewelry():
    ring = item_lib.ngon_ring("ring", 10, 0.11, 0.035, 0.05, (0, 0, 0), color("gold"))
    for part in ring:
        lpm.rotate(part, 90, "X")
        lpm.move(part, 0, 0.025, 0.1275)
    gem = lpm.lathe("gem", [(0.0, 0), (0.055, 0.035), (0.055, 0.047), (0.032, 0.08)], segments=8, at=(0, 0, 0.238), color=color("gem"))
    lpm.paint(gem, color("white"), where=lambda c, n, i: n.z > 0.9)
    return [gem] + ring


def planks():
    rng = random.Random(4)
    board = lpm.grid_box("board", (0.46, 0.13, 0.03), color=color("wood"), nx=8, nz=1)
    lpm.paint(board, color("wood_light"), where=lambda c, n, i: n.z > 0.5 and i % 3 == 0)
    lpm.paint(board, color("wood_dark"), where=lambda c, n, i: abs(n.x) > 0.9)
    for vertex in board.data.vertices:
        vertex.co.y += 0.008 * math.sin(vertex.co.x * 14) + rng.uniform(-0.004, 0.004)
        vertex.co.z += rng.uniform(-0.002, 0.002) + 0.004 * vertex.co.x
    parts = [board]
    knots = [(-0.12, 0.02, 0.026), (0.11, -0.03, 0.018), (0.02, 0.035, 0.012)]
    for i, (x, y, radius) in enumerate(knots):
        parts.append(lpm.prism(f"knot{i}", 8, radius, 0.006, at=(x, y, 0.028 + 0.004 * x), color=color("wood_dark"), radius_top=radius * 0.8))
        parts.append(lpm.prism(f"core{i}", 8, radius * 0.45, 0.008, at=(x, y, 0.028 + 0.004 * x), color=color("coal")))
    for i in range(4):
        x = rng.uniform(-0.18, 0.05)
        y = rng.uniform(-0.05, 0.05)
        parts.append(lpm.box(f"grain{i}", (rng.uniform(0.12, 0.22), 0.005, 0.004), at=(x, y, 0.029 + 0.004 * x), color=color("wood_dark")))
    return parts


def i_beam(prefix, at, rotation):
    outline = [(-0.07, 0), (0.07, 0), (0.07, 0.03), (0.015, 0.03), (0.015, 0.11), (0.07, 0.11), (0.07, 0.14),
               (-0.07, 0.14), (-0.07, 0.11), (-0.015, 0.11), (-0.015, 0.03), (-0.07, 0.03)]
    beam = lpm.sweep(prefix, outline, 0.40, at=at, color=color("steel"))
    lpm.paint(beam, color("metal"), where=lambda c, n, i: abs(n.y) > 0.5)
    lpm.rotate(beam, rotation, "Z")
    return beam


def steel():
    return [i_beam("a", (0, 0, 0), 0)]


def tile(prefix, z, deg, pattern=False):
    parts = [
        lpm.box(f"{prefix}base", (0.28, 0.28, 0.025), at=(0, 0, z), color=color("tile_cream")),
        lpm.box(f"{prefix}glaze", (0.23, 0.23, 0.004), at=(0, 0, z + 0.025), color=color("tile_blue")),
    ]
    if pattern:
        for gx in (-1, 1):
            for gy in (-1, 1):
                parts.append(lpm.box(f"{prefix}dot{gx}{gy}", (0.07, 0.07, 0.004), at=(gx * 0.055, gy * 0.055, z + 0.029), color=color("tile_cream")))
    return spin(parts, deg, (0, 0, 0))


def tiles():
    return tile("a", 0.0, 0, pattern=True)


def tools():
    wrench_outline = [(-0.18, -0.02), (0.10, -0.02), (0.10, -0.06), (0.17, -0.06), (0.17, -0.015), (0.13, -0.015),
                      (0.13, 0.015), (0.17, 0.015), (0.17, 0.06), (0.10, 0.06), (0.10, 0.02), (-0.18, 0.02)]
    wrench = [lpm.sweep("wrench", wrench_outline, 0.025, color=color("steel"), axis="z")]
    hammer_z = 0.026
    hammer = [
        lpm.box("handle", (0.34, 0.035, 0.03), at=(0, 0, hammer_z), color=color("wood")),
        lpm.box("head", (0.06, 0.11, 0.05), at=(0.14, 0, hammer_z), color=color("metal_dark")),
        lpm.box("face", (0.03, 0.12, 0.055), at=(0.185, 0, hammer_z), color=color("metal")),
        lpm.box("grip", (0.09, 0.04, 0.034), at=(-0.12, 0, hammer_z), color=color("wood_dark")),
    ]
    return spin(wrench, 28, (0, 0, 0)) + spin(hammer, -28, (0, 0, 0))


def radial(part, radius, yaw, tilt=0.0):
    at = (radius, 0, 0)
    if tilt:
        lpm.rotate(part, tilt, "Y", about=at)
    lpm.rotate(part, yaw, "Z")
    return part


def apple_cake():
    base = lpm.prism("crust", 12, 0.165, 0.055, color=color("crust"), radius_top=0.155)
    lpm.paint(base, color("crust_dark"), where=lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.5)
    filling = lpm.prism("filling", 12, 0.135, 0.012, at=(0, 0, 0.05), color=color("batter"))
    parts = [base, filling]
    for index in range(8):
        yaw = 45 * index
        slice_ = lpm.box(f"slice{index}", (0.075, 0.034, 0.014), at=(0.085, 0, 0.056), color=color("apple_slice"), taper=(0.9, 0.7))
        skin = lpm.box(f"skin{index}", (0.012, 0.034, 0.016), at=(0.118, 0, 0.056), color=color("apple_dark"))
        parts += [radial(slice_, 0.085, yaw, 12), radial(skin, 0.118, yaw, 12)]
    parts.append(lpm.prism("core", 8, 0.03, 0.02, at=(0, 0, 0.056), color=color("apple_slice")))
    parts.append(lpm.box("dust", (0.04, 0.02, 0.004), at=(0.0, 0.0, 0.076), color=color("sugar")))
    return parts


def cherry_clafoutis():
    dish = lpm.prism("dish", 12, 0.16, 0.06, color=color("clay"), radius_top=0.15)
    lpm.paint(dish, color("clay_dark"), where=lambda c, n, i: i % 4 == 1 and abs(n.z) < 0.5)
    custard = lpm.prism("custard", 12, 0.138, 0.014, at=(0, 0, 0.048), color=color("batter"))
    lpm.paint(custard, color("crust"), where=lambda c, n, i: i % 3 == 0 and n.z > 0.5)
    parts = [dish, custard]
    spots = ((0.0, 0.0), (0.075, 0.03), (-0.07, 0.05), (0.03, -0.08), (-0.05, -0.06), (0.1, -0.05), (-0.11, -0.01))
    for index, (x, y) in enumerate(spots):
        body = "cherry" if index % 2 == 0 else "cherry_dark"
        profile = [(0, -0.026), (0.022, -0.016), (0.03, 0.0), (0.022, 0.018), (0, 0.028)]
        parts.append(lpm.lathe(f"cherry{index}", profile, segments=6, at=(x, y, 0.078), color=color(body)))
    parts.append(lpm.box("dust_a", (0.05, 0.012, 0.004), at=(-0.02, 0.09, 0.062), color=color("sugar")))
    parts.append(lpm.box("dust_b", (0.04, 0.012, 0.004), at=(0.06, -0.1, 0.062), color=color("sugar")))
    return parts


def fougasse():
    outline = [(-0.19, 0.0), (-0.11, 0.075), (0.0, 0.105), (0.11, 0.075), (0.19, 0.0), (0.11, -0.075), (0.0, -0.105), (-0.11, -0.075)]
    loaf = lpm.sweep("loaf", outline, 0.032, color=color("crust"), axis="z")
    top = lpm.sweep("top", [(x * 0.88, y * 0.86) for x, y in outline], 0.012, at=(0, 0, 0.03), color=color("crust_light"), axis="z")
    parts = [loaf, top]
    for index, (x, side) in enumerate(((-0.09, 1), (-0.09, -1), (0.0, 1), (0.0, -1), (0.09, 1), (0.09, -1))):
        slit = lpm.box(f"slit{index}", (0.075, 0.016, 0.006), at=(x, side * 0.04, 0.0415), color=color("crust_dark"))
        lpm.rotate(slit, -side * 42, "Z", about=(x, side * 0.04, 0))
        parts.append(slit)
    olives = ((-0.13, 0.0, "olive_black"), (-0.045, 0.0, "olive_green"), (0.05, 0.0, "olive_black"), (0.125, 0.0, "olive_green"),
              (-0.03, 0.07, "olive_green"), (0.03, -0.07, "olive_black"), (-0.07, -0.065, "olive_black"), (0.085, 0.06, "olive_black"))
    for index, (x, y, body) in enumerate(olives):
        parts.append(lpm.lathe(f"olive{index}", [(0, -0.014), (0.018, -0.008), (0.02, 0.0), (0.016, 0.01), (0, 0.016)], segments=6, at=(x, y, 0.046), color=color(body)))
    return parts


def bread():
    profile = [(0.0, 0.0), (0.15, 0.0), (0.17, 0.03), (0.15, 0.08), (0.10, 0.12), (0.0, 0.135)]
    boule = lpm.lathe("boule", profile, segments=10, color=color("crust"))
    lpm.paint(boule, color("crust_dark"), where=lambda c, n, i: n.z < 0.3 and i % 3 == 0)
    lpm.scale(boule, 1.0, 0.85, 1.0)
    lpm.rotate(boule, 12, "Z")
    parts = [boule]
    for index, offset in enumerate((-0.05, 0.0, 0.05)):
        cut = lpm.box(f"cut{index}", (0.10, 0.016, 0.01), at=(0.0, offset, 0.131 - abs(offset) * 0.1), color=color("crust_light"))
        lpm.rotate(cut, 12 + 35, "Z", about=(0.0, offset, 0))
        parts.append(cut)
    baguette = lpm.prism("baguette", 6, 0.04, 0.34, color=color("crust_light"), radius_top=0.036)
    lpm.paint(baguette, color("crust"), where=lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.5)
    lpm.rotate(baguette, 90, "Y")
    lpm.move(baguette, -0.17, 0.0, 0.04)
    lpm.rotate(baguette, -10, "Z", about=(0, 0, 0))
    lpm.move(baguette, 0.0, 0.2, 0.0)
    for index in range(4):
        slash = lpm.box(f"slash{index}", (0.05, 0.012, 0.008), at=(-0.11 + index * 0.07, 0.2 + 0.02 - index * 0.012, 0.073), color=color("crust_dark"))
        lpm.rotate(slash, -10 + 40, "Z", about=(-0.11 + index * 0.07, 0.22 - index * 0.012, 0))
        parts.append(slash)
    parts.append(baguette)
    return parts


def cream():
    pot = lpm.lathe("pot", [(0, 0), (0.075, 0), (0.088, 0.02), (0.088, 0.10), (0.078, 0.108), (0, 0.108)], segments=9, color=color("cream_pot"))
    lpm.paint(pot, color("crust_light"), where=lambda c, n, i: c.z < 0.05 and abs(n.z) < 0.5 and i % 2 == 0)
    swirl = lpm.lathe("swirl", [(0, 0.10), (0.075, 0.10), (0.065, 0.13), (0.045, 0.155), (0.02, 0.175), (0, 0.19)], segments=8, color=color("milk_white"))
    spoon = lpm.prism("spoon", 4, 0.007, 0.16, at=(0, 0, 0), color=color("wood"))
    lpm.rotate(spoon, 70, "Y")
    lpm.move(spoon, 0.12, -0.02, 0.02)
    bowl = lpm.lathe("spoon_bowl", [(0, 0), (0.022, 0.004), (0.026, 0.015), (0, 0.02)], segments=6, at=(0.27, -0.02, 0.06), color=color("wood"))
    return [pot, swirl, lpm.prism("rim", 9, 0.09, 0.012, at=(0, 0, 0.1), color=color("cream_pot")), spoon, bowl]


def cheese_wheel(name, radius, height, at):
    x, y, z = at
    parts = [
        lpm.prism(f"{name}_rind", 12, radius, height, color=color("cheese_rind")),
        lpm.prism(f"{name}_body", 12, radius * 0.97, height * 0.84, at=(0, 0, height * 0.08), color=color("cheese")),
    ]
    for index, (hx, hy) in enumerate(((0.35, 0.1), (-0.3, 0.35), (-0.1, -0.4), (0.25, -0.35))):
        parts.append(lpm.box(f"{name}_hole{index}", (radius * 0.2, radius * 0.2, 0.006), at=(radius * hx, radius * hy, height), color=color("cheese_dark")))
    for part in parts:
        lpm.move(part, x, y, z)
    return parts


def cheese():
    parts = cheese_wheel("wheel", 0.15, 0.1, (-0.06, 0.04, 0))
    wedge = lpm.sweep("wedge", [(0, 0), (0.17, 0.05), (0.17, -0.05)], 0.08, at=(0.12, -0.12, 0), color=color("cheese"), axis="z")
    lpm.rotate(wedge, 20, "Z", about=(0.12, -0.12, 0))
    parts.append(wedge)
    return parts


def goat_cheese():
    parts = []
    for index, (x, y, scale) in enumerate(((-0.08, 0.0, 1.0), (0.08, 0.02, 1.0), (0.0, -0.1, 0.9))):
        parts.append(lpm.prism(f"puck{index}", 10, 0.075 * scale, 0.045, at=(x, y, 0.0), color=color("goat_white"), radius_top=0.07 * scale))
        parts.append(lpm.prism(f"puck{index}_band", 10, 0.0765 * scale, 0.012, at=(x, y, 0.015), color=color("wool_shade")))
    parts.append(lpm.prism("top", 10, 0.06, 0.04, at=(0.0, 0.0, 0.045), color=color("goat_white"), radius_top=0.055))
    parts.append(leaf("herb_a", (0.0, 0.0, 0.088), 30, 0.07, 0.035, "herb"))
    parts.append(leaf("herb_b", (0.0, 0.0, 0.09), 150, 0.06, 0.03, "herb"))
    return parts


def sweater_parts(prefix, body, dark, stripe=None):
    parts = [
        lpm.box(f"{prefix}body", (0.2, 0.19, 0.05), at=(0, 0, 0), color=color(body)),
        lpm.box(f"{prefix}hem", (0.202, 0.03, 0.052), at=(0, -0.08, 0), color=color(dark)),
        lpm.prism(f"{prefix}neck", 8, 0.04, 0.054, at=(0, 0.085, 0), color=color(dark)),
    ]
    for side in (-1, 1):
        sleeve = lpm.box(f"{prefix}sleeve{side}", (0.15, 0.07, 0.044), at=(side * 0.175, 0.045, 0), color=color(body))
        cuff = lpm.box(f"{prefix}cuff{side}", (0.03, 0.074, 0.046), at=(side * 0.25, 0.045, 0), color=color(dark))
        for part in (sleeve, cuff):
            lpm.rotate(part, side * -25, "Z", about=(side * 0.1, 0.07, 0))
        parts += [sleeve, cuff]
    if stripe:
        for index, y in enumerate((-0.02, 0.03)):
            parts.append(lpm.box(f"{prefix}stripe{index}", (0.204, 0.018, 0.053), at=(0, y, 0), color=color(stripe)))
    return parts


def sweater():
    return sweater_parts("s_", "jumper_pink", "jumper_pink_dark")


def alpaca_sweater():
    return sweater_parts("a_", "alpaca", "fabric_alpaca_dark", "alpaca_light")


def mitten(prefix, at, yaw):
    x, y, z = at
    parts = [
        lpm.box(f"{prefix}palm", (0.1, 0.13, 0.045), at=(0, 0, 0), color=color("glove_blue"), taper=(1.0, 0.9)),
        lpm.box(f"{prefix}fingers", (0.1, 0.07, 0.04), at=(0, 0.12, 0), color=color("glove_blue"), taper=(0.8, 0.7)),
        lpm.box(f"{prefix}cuff", (0.11, 0.035, 0.05), at=(0, -0.07, 0), color=color("glove_blue_dark")),
        lpm.box(f"{prefix}thumb", (0.04, 0.07, 0.038), at=(0.065, 0.03, 0), color=color("glove_blue")),
    ]
    lpm.rotate(parts[3], -30, "Z", about=(0.065, 0.0, 0))
    for part in parts:
        lpm.rotate(part, yaw, "Z")
        lpm.move(part, x, y, z)
    return parts


def gloves():
    return mitten("l_", (-0.08, -0.04, 0), 12) + mitten("r_", (0.1, 0.0, 0), -8)


def hat():
    dome = lpm.lathe("dome", [(0.115, 0.03), (0.12, 0.06), (0.105, 0.1), (0.07, 0.135), (0.03, 0.155), (0, 0.16)], segments=10, color=color("hat_red"))
    lpm.paint(dome, color("hat_cream"), where=lambda c, n, i: i % 5 == 2)
    cuff = lpm.prism("cuff", 10, 0.125, 0.045, color=color("hat_cream"))
    pom = lpm.lathe("pom", [(0, 0), (0.03, 0.005), (0.04, 0.03), (0.03, 0.055), (0, 0.06)], segments=7, at=(0, 0, 0.158), color=color("hat_cream"))
    return [dome, cuff, pom]


def scarf():
    colors = ("scarf_violet", "scarf_pink")
    parts = []
    for index in range(6):
        parts.append(lpm.box(f"low{index}", (0.055, 0.1, 0.028), at=(-0.15 + index * 0.055, -0.07, 0), color=color(colors[index % 2])))
        parts.append(lpm.box(f"up{index}", (0.055, 0.1, 0.028), at=(-0.15 + index * 0.055, 0.07, 0.03), color=color(colors[(index + 1) % 2])))
    parts.append(lpm.box("fold", (0.07, 0.24, 0.03), at=(-0.18, 0.0, 0.0), color=color("scarf_violet")))
    for index, x in enumerate((-0.14, -0.08, -0.02, 0.04)):
        parts.append(lpm.box(f"fringe{index}", (0.012, 0.045, 0.012), at=(0.19, -0.08 + index * 0.05, 0.0), color=color("scarf_pink")))
    return parts


MODELS = {
    "appleCake": apple_cake, "bread": bread, "cherryClafoutis": cherry_clafoutis, "fougasse": fougasse,
    "bricks": bricks, "cannedFish": canned_fish, "cement": cement, "circuits": circuits, "crystal": crystal,
    "glass": glass, "jewelry": jewelry, "planks": planks, "steel": steel, "tiles": tiles, "tools": tools,
    "cream": cream, "cheese": cheese, "goatCheese": goat_cheese, "sweater": sweater, "alpacaSweater": alpaca_sweater,
    "gloves": gloves, "hat": hat, "scarf": scarf,
}

out_dir = os.path.dirname(os.path.abspath(__file__))
only = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
for model_id, make_parts in MODELS.items():
    if only and model_id not in only:
        continue
    item_lib.build(model_id, make_parts, out_dir)
