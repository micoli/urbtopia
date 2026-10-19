import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("wood", "#a8683a"), ("wood_dark", "#6e4222"), ("wood_light", "#d9a066"), ("bark", "#8a5a34"), ("tan", "#e8c9a0"),
    ("stone", "#8f93a0"), ("stone_dark", "#686c78"),
    ("log", "#7a4a2a"), ("log_dark", "#573320"), ("log_end", "#d9b27a"),
    ("flame_red", "#e8401c"), ("flame_orange", "#ff8a1f"), ("flame_yellow", "#ffd23f"),
    ("white", "#ffffff"), ("cloth", "#f6f4ee"), ("blue_cloth", "#3a6fc0"),
    ("red", "#e0302f"), ("yellow", "#ffd23f"), ("blue", "#2f6fe0"), ("blue_dark", "#1f4fb0"),
    ("green", "#3fa83f"), ("green_dark", "#26782f"), ("green_light", "#7fd04a"),
    ("purple", "#9a5ad0"), ("pink", "#f27fb0"), ("orange", "#f28a1c"), ("black", "#26262e"),
    ("strawberry", "#e0283c"), ("cake", "#fff0d6"), ("bread", "#c98a3e"), ("clay", "#cf6a40"),
])
C = {n: P[n] for n, *_ in P.entries}


def fillet(ob, width, min_angle=0.35):
    """Round the sharp edges of a single-coloured part."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    layer = bm.faces.layers.int["lpm_color"]
    bm.faces.ensure_lookup_table()
    color = bm.faces[0][layer]
    edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > min_angle]
    bmesh.ops.bevel(bm, geom=edges, offset=width, segments=1, affect="EDGES")
    for f in bm.faces:
        f[layer] = color
        f.smooth = False
    bm.to_mesh(ob.data)
    bm.free()
    return ob


def sphere(name, r, centre, color, segments=6, rings=4):
    profile = [(0, 0)] + [(r * math.cos(math.radians(a)), r + r * math.sin(math.radians(a))) for a in range(-90 + 180 // rings, 90, 180 // rings)] + [(0, 2 * r)]
    return lpm.lathe(name, profile, segments=segments, at=(centre[0], centre[1], centre[2] - r), color=color)


def blob(name, radii, centre, color, segments=6, rings=4):
    part = sphere(name, 1.0, (0, 0, 0), color, segments, rings)
    lpm.scale(part, *radii)
    return lpm.move(part, *centre)


def orient(parts, direction, at, spin=0):
    """Turn parts built facing +Z so they face `direction`, then move them to `at`."""
    rotation = Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized()).to_matrix().to_4x4()
    matrix = Matrix.Translation(Vector(at)) @ rotation @ Matrix.Rotation(math.radians(spin), 4, "Z")
    for p in parts:
        p.data.transform(matrix)
    return parts


def ribbon(tag, start, end, width, colour):
    length = (Vector(end) - Vector(start)).length
    part = lpm.box(f"ribbon{tag}", (width, 0.008, length), color=C[colour])
    return orient([part], Vector(end) - Vector(start), start, spin=40)[0]


# ------------------------------------------------------------------ flowers
KINDS = {
    "daisy": ("white", "yellow", 6),
    "blue": ("blue", "blue_dark", 6),
    "buttercup": ("yellow", "orange", 5),
    "purple": ("purple", "yellow", 5),
    "pink": ("pink", "yellow", 5),
}
PETAL = [(-0.014, 0.01), (0.014, 0.01), (0.0, 0.065)]


def flower(tag, kind, at, direction=(0, 0, 1), size=1.0, spin=0):
    petal_colour, centre_colour, count = KINDS[kind]
    parts = []
    for k in range(count):
        petal = lpm.sweep(f"pet{tag}{k}", [(x * 1.2, z) for x, z in PETAL], 0.008, at=(0, 0, 0.002 * (k % 2)), color=C[petal_colour], axis="z")
        parts.append(lpm.rotate(petal, 360 * k / count, "Z"))
    parts.append(lpm.prism(f"cen{tag}", 5, 0.016, 0.014, at=(0, 0, 0.004), color=C[centre_colour]))
    for p in parts:
        lpm.scale(p, size, size, size)
    return orient(parts, direction, at, spin)


def leaf_blob(tag, centre, size=0.045, dark=False):
    return blob(f"leaf{tag}", (size, size, size * 0.7), centre, C["green_dark"] if dark else C["green"], segments=5, rings=3)


def spiral(tag, radius, z0, z1, count, turns, kinds, seed=0, flower_size=1.5, leaf_size=0.06):
    """Leaves and flowers winding up a vertical pole."""
    rng = random.Random(seed)
    parts = []
    for k in range(count):
        t = k / max(count - 1, 1)
        a = math.radians(360 * turns * t + rng.uniform(-10, 10))
        radial = (math.cos(a), math.sin(a), 0.15)
        z = z0 + (z1 - z0) * t
        parts.append(leaf_blob(f"{tag}{k}", (radius * math.cos(a), radius * math.sin(a), z), leaf_size, dark=k % 3 == 0))
        if k % 2 == 0:
            kind = kinds[(k // 2) % len(kinds)]
            parts += flower(f"{tag}{k}", kind, ((radius + 0.03) * math.cos(a), (radius + 0.03) * math.sin(a), z + 0.01), radial, flower_size)
    return parts


def wreath(tag, centre, radius, normal, kinds, count=10):
    """Ring of leaves and flowers; the ring plane is perpendicular to `normal`."""
    parts = []
    for k in range(count):
        a = 2 * math.pi * k / count
        local = Vector((radius * math.cos(a), radius * math.sin(a), 0))
        parts.append(blob(f"wl{tag}{k}", (0.04, 0.04, 0.03), tuple(local), C["green"] if k % 2 else C["green_dark"], segments=5, rings=3))
        if k % 2 == 0:
            parts += flower(f"wf{tag}{k}", kinds[(k // 2) % len(kinds)], tuple(local + Vector((0, 0, 0.03))), (0, 0, 1), 0.9)
    return orient(parts, normal, centre)


# ------------------------------------------------------------------ simple totem
HORSE_HEAD = [(-0.02, 0), (0.1, 0), (0.11, 0.1), (0.09, 0.2), (0.07, 0.3), (0.03, 0.25), (-0.04, 0.25), (-0.16, 0.17), (-0.17, 0.1), (-0.1, 0.1), (-0.05, 0.05)]


def totem_simple():
    parts = []
    for k in range(7):
        a = 2 * math.pi * k / 7
        parts.append(blob(f"stone{k}", (0.1, 0.1, 0.07), (0.27 * math.cos(a), 0.27 * math.sin(a), 0.05), C["stone"] if k % 2 else C["stone_dark"]))
    z0 = 0.06
    parts.append(fillet(lpm.box("shaft", (0.22, 0.22, 1.1), at=(0, 0, z0), color=C["tan"]), 0.008))
    parts.append(fillet(lpm.box("band_red", (0.236, 0.236, 0.27), at=(0, 0, z0 + 0.02), color=C["red"]), 0.006))
    parts.append(fillet(lpm.box("band_blue", (0.236, 0.236, 0.2), at=(0, 0, z0 + 0.3), color=C["blue"]), 0.006))
    parts.append(fillet(lpm.box("band_red_top", (0.236, 0.236, 0.2), at=(0, 0, z0 + 0.54), color=C["red"]), 0.006))
    diamond = [(0, -0.07), (0.05, 0), (0, 0.07), (-0.05, 0)]
    zigzag = [(-0.1, 0), (-0.05, 0.05), (0, 0), (0.05, 0.05), (0.1, 0), (0.1, 0.02), (0.05, 0.07), (0, 0.02), (-0.05, 0.07), (-0.1, 0.02)]
    for side in (-1, 1):
        y = side * 0.118
        parts.append(lpm.sweep(f"dia{side}", diamond, 0.008, at=(0, y, z0 + 0.15), color=C["white"]))
        parts.append(lpm.sweep(f"zig{side}", zigzag, 0.008, at=(0, y, z0 + 0.36), color=C["white"]))
        parts.append(lpm.sweep(f"dia_top{side}", diamond, 0.008, at=(0, y, z0 + 0.64), color=C["white"]))
        x = side * 0.118
        parts.append(lpm.sweep(f"diaS{side}", diamond, 0.008, at=(x, 0, z0 + 0.15), color=C["white"], axis="y"))
        lpm.rotate(parts[-1], 90, "Z", about=(0, 0, 0))
    top = z0 + 1.1
    head = fillet(lpm.sweep("horse", HORSE_HEAD, 0.1, at=(0, 0, top), color=C["red"]), 0.006)
    parts.append(head)
    parts.append(lpm.box("mane", (0.025, 0.11, 0.2), at=(0.1, 0, top + 0.08), color=C["white"]))
    parts.append(lpm.box("horse_eye", (0.02, 0.108, 0.02), at=(-0.1, 0, top + 0.18), color=C["black"]))
    bar_z = z0 + 0.85
    parts.append(fillet(lpm.box("bar", (0.74, 0.06, 0.06), at=(0, 0, bar_z), color=C["wood"]), 0.005))
    for side in (-1, 1):
        parts += wreath(f"t{side}", (side * 0.3, 0.0, bar_z - 0.14), 0.09, (0, 1, 0), ["daisy", "blue", "buttercup"], count=8)
        parts.append(lpm.box(f"string{side}", (0.012, 0.012, 0.1), at=(side * 0.3, 0, bar_z - 0.06), color=C["wood_dark"]))
        for k, colour in enumerate(("red", "yellow", "blue")):
            parts.append(ribbon(f"t{side}{k}", (side * (0.3 + 0.02 * k), 0, bar_z - 0.2), (side * (0.3 + 0.03 * k), 0.02 * k, bar_z - 0.62), 0.04, colour))
    parts += spiral("tt", 0.13, z0 + 0.72, z0 + 1.06, 10, 2.0, ["daisy", "blue", "buttercup", "purple"], seed=1)
    parts += flower("tb", "daisy", (0.0, -0.13, z0 + 0.8), (0, -1, 0.1))
    return lpm.finish("SM_MS_TotemSimple", parts, P, budget=4500)


# ------------------------------------------------------------------ maypole 1x2
def maypole():
    parts = []
    for k in range(6):
        a = 2 * math.pi * k / 6
        parts.append(blob(f"base{k}", (0.1, 0.1, 0.07), (0.14 * math.cos(a), 0.14 * math.sin(a), 0.04), C["green"] if k % 2 else C["green_dark"]))
    parts.append(fillet(lpm.prism("pole", 8, 0.08, 1.72, color=C["bark"], radius_top=0.06, rotate=22.5), 0.006))
    parts += spiral("pole", 0.1, 0.1, 1.62, 42, 3.6, ["daisy", "blue", "buttercup", "purple", "daisy"], seed=2)
    bar_z = 1.28
    parts.append(fillet(lpm.box("bar", (0.07, 1.34, 0.07), at=(0, 0, bar_z), color=C["wood"]), 0.005))
    for k in range(9):
        y = -0.6 + 0.15 * k
        parts.append(leaf_blob(f"bar{k}", (0, y, bar_z + 0.04), 0.075, dark=k % 2 == 0))
        if k % 2 == 0:
            parts += flower(f"bar{k}", ["daisy", "blue", "buttercup"][(k // 2) % 3], (0.0, y, bar_z + 0.09), (0.0, 0.0, 1.0), 1.5)
    for side in (-1, 1):
        y = side * 0.55
        parts += wreath(f"m{side}", (0, y, bar_z - 0.3), 0.19, (1, 0, 0), ["daisy", "blue", "buttercup", "purple"], count=12)
        parts.append(lpm.box(f"string{side}", (0.012, 0.012, 0.12), at=(0, y, bar_z - 0.12), color=C["wood_dark"]))
        for k, colour in enumerate(("red", "yellow", "blue")):
            parts.append(ribbon(f"w{side}{k}", (0.0, y + (k - 1) * 0.04, bar_z - 0.5), (0.0, y + (k - 1) * 0.07, 0.3 + 0.06 * k), 0.06, colour))
    top = 1.68
    ends = [(0.4, -0.62), (-0.4, -0.5), (0.34, 0.62), (-0.4, 0.5), (0.42, 0.04), (-0.42, 0.0)]
    for k, (x, y) in enumerate(ends):
        parts.append(ribbon(f"top{k}", (0, 0, top), (x, y, 0.06), 0.1, ("red", "yellow", "blue")[k % 3]))
    parts += flower("crown", "daisy", (0, 0, top + 0.04), (0, 0, 1), 1.3)
    return lpm.finish("SM_MS_Maypole", parts, P, budget=7000)


# ------------------------------------------------------------------ arch 1x2
def arch():
    parts = []
    radius, centre_z = 0.82, 0.8
    for side in (-1, 1):
        y = side * radius
        for k in range(3):
            parts.append(blob(f"rock{side}{k}", (0.11, 0.11, 0.07), (0.1 * math.cos(k * 2.1), y + 0.1 * math.sin(k * 2.1), 0.05), C["stone"] if k % 2 else C["stone_dark"]))
        parts.append(fillet(lpm.box(f"post{side}", (0.16, 0.16, centre_z + 0.05), at=(0, y, 0.04), color=C["wood"]), 0.006))
        parts += spiral(f"post{side}", 0.11, 0.12, centre_z, 18, 2.2, ["daisy", "blue", "buttercup"], seed=side + 5)
    steps = 14
    for k in range(steps + 1):
        t = math.pi * k / steps
        y, z = radius * math.cos(t), centre_z + radius * math.sin(t)
        chord = 2 * radius * math.sin(math.pi / steps / 2) * 1.15
        seg = lpm.box(f"arc{k}", (0.13, chord, 0.13), at=(0, 0, 0), color=C["wood"])
        lpm.rotate(seg, math.degrees(t) + 90, "X")
        parts.append(lpm.move(seg, 0, y, z))
        parts.append(leaf_blob(f"arc{k}", (0, y, z), 0.115, dark=k % 2 == 0))
        for side in (-1, 1):
            if (k + (side > 0)) % 2 == 0:
                inward = (side, 0.0, 0.25)
                parts += flower(f"arc{k}{side}", ["daisy", "blue", "buttercup", "purple", "pink"][(k // 2) % 5], (side * 0.1, y, z + 0.01), inward, 1.6)
    for side in (-1, 1):
        parts.append(lpm.box(f"drape{side}", (0.03, 0.3, 0.82), at=(0.0, side * 0.42, 0.05), color=C["cloth"], taper=(1.0, 0.6)))
        for k, colour in enumerate(("red", "yellow", "blue")):
            parts.append(ribbon(f"a{side}{k}", (0.03, side * (0.62 + 0.03 * k), centre_z + 0.5 - 0.1 * k), (0.03, side * (0.66 + 0.03 * k), 0.12 + 0.06 * k), 0.045, colour))
    parts.append(lpm.box("drape_mid", (0.03, 0.24, 0.5), at=(0, 0.0, centre_z + 0.31), color=C["cloth"], taper=(1.0, 0.55)))
    return lpm.finish("SM_MS_Arch", parts, P, budget=6500)


# ------------------------------------------------------------------ bonfire
def flame_outline(height, width):
    h, w = height, width
    return [(-w, 0), (-w * 1.0, 0.3 * h), (-w * 0.7, 0.55 * h), (-w * 0.55, 0.8 * h), (-w * 0.2, 0.62 * h), (0, h), (w * 0.25, 0.7 * h), (w * 0.55, 0.9 * h), (w * 0.7, 0.5 * h), (w, 0.3 * h), (w, 0)]


def bonfire():
    parts = []
    rng = random.Random(8)
    for k in range(13):
        a = 2 * math.pi * k / 13
        r = 0.78 + rng.uniform(-0.03, 0.04)
        parts.append(blob(f"stone{k}", (0.15, 0.13, 0.11), (r * math.cos(a), r * math.sin(a), 0.07), C["stone"] if k % 2 else C["stone_dark"], segments=6, rings=4))
    for k in range(12):
        a = math.radians(30 * k + 8)
        log = lpm.prism(f"log{k}", 6, 0.075, 1.0 - 0.04 * (k % 3), color=C["log"] if k % 2 else C["log_dark"], radius_top=0.065, rotate=15)
        lpm.paint(log, C["log_end"], lambda c, n, i: n.z > 0.5)
        lpm.rotate(log, -28 - 4 * (k % 2), "Y")
        lpm.rotate(log, math.degrees(a), "Z")
        parts.append(lpm.move(log, 0.46 * math.cos(a), 0.46 * math.sin(a), 0.08))
    for k in range(3):
        parts.append(lpm.rotate(lpm.prism(f"flat{k}", 6, 0.1, 0.26, color=C["log"], rotate=15), 90, "Y"))
        lpm.move(parts[-1], 0.15 * k - 0.1, 0.3 - 0.3 * k, 0.12)
    for k, (h, w, colour, extra) in enumerate(((1.25, 0.44, "flame_red", 0.0), (1.0, 0.34, "flame_orange", 0.004), (0.68, 0.23, "flame_yellow", 0.008))):
        for yaw in (0, 60, 120):
            parts.append(lpm.rotate(lpm.sweep(f"flame{k}{yaw}", flame_outline(h, w), 0.03 + extra, at=(0, 0, 0.18), color=C[colour]), yaw, "Z"))
    rng2 = random.Random(2)
    for k in range(7):
        x, y, z = rng2.uniform(-0.35, 0.35), rng2.uniform(-0.35, 0.35), rng2.uniform(1.3, 1.6)
        parts.append(lpm.prism(f"spark{k}", 4, 0.025, 0.04, at=(x, y, z), color=C["flame_yellow"], radius_top=0.002))
    for k in range(12):
        a = math.radians(30 * k + 20)
        r = 0.62
        pos = (r * math.cos(a), r * math.sin(a), 0.2 + 0.1 * (k % 3))
        parts.append(leaf_blob(f"fire{k}", (pos[0], pos[1], pos[2] - 0.03), 0.1, dark=k % 2 == 0))
        parts += flower(f"fire{k}", ["daisy", "daisy", "purple", "buttercup", "blue"][k % 5], pos, (math.cos(a), math.sin(a), 0.7), 1.9)
    return lpm.finish("SM_MS_Bonfire", parts, P, budget=6000)


# ------------------------------------------------------------------ banquet table
def vase():
    parts = [lpm.lathe("vase_body", [(0.0, 0), (0.035, 0), (0.05, 0.05), (0.03, 0.09), (0.035, 0.1)], segments=6, color=C["clay"])]
    return parts


def banquet_table():
    parts = []
    top_z = 0.52
    parts.append(fillet(lpm.box("top", (1.5, 0.72, 0.07), at=(0, 0, top_z), color=C["wood_light"]), 0.01))
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(fillet(lpm.box(f"leg{sx}{sy}", (0.08, 0.08, top_z + 0.01), at=(sx * 0.62, sy * 0.28, 0), color=C["wood"]), 0.006))
        parts.append(lpm.box(f"brace{sx}", (0.05, 0.56, 0.05), at=(sx * 0.62, 0, 0.18), color=C["wood"]))
    parts.append(lpm.box("rail", (1.24, 0.05, 0.05), at=(0, 0, 0.2), color=C["wood"]))
    for sy in (-1, 1):
        parts.append(fillet(lpm.box(f"bench{sy}", (1.5, 0.22, 0.05), at=(0, sy * 0.58, 0.3), color=C["wood_light"]), 0.008))
        for sx in (-1, 1):
            parts.append(fillet(lpm.box(f"bench_leg{sy}{sx}", (0.06, 0.18, 0.31), at=(sx * 0.58, sy * 0.58, 0), color=C["wood"]), 0.005))
    cloth_z = top_z + 0.07
    parts.append(lpm.box("cloth", (1.38, 0.4, 0.012), at=(0, 0, cloth_z), color=C["cloth"]))
    for side in (-1, 1):
        parts.append(lpm.box(f"cloth_hem{side}", (0.12, 0.4, 0.016), at=(side * 0.62, 0, cloth_z), color=C["blue_cloth"]))
    for k in range(5):
        parts.append(lpm.sweep(f"motif{k}", [(0, -0.05), (0.03, 0), (0, 0.05), (-0.03, 0)], 0.004, at=(-0.45 + 0.225 * k, 0, cloth_z + 0.012), color=C["blue_cloth"], axis="z"))
    t = cloth_z + 0.012
    parts.append(lpm.prism("plate", 10, 0.18, 0.015, at=(-0.2, 0.0, t), color=C["white"]))
    parts.append(fillet(lpm.prism("cake", 10, 0.15, 0.1, at=(-0.2, 0.0, t + 0.015), color=C["cake"]), 0.006))
    for k in range(8):
        a = 2 * math.pi * k / 8
        parts.append(blob(f"cake_berry{k}", (0.03, 0.03, 0.03), (-0.2 + 0.11 * math.cos(a), 0.11 * math.sin(a), t + 0.125), C["strawberry"], segments=5, rings=3))
    parts.append(blob("cake_berry_c", (0.035, 0.035, 0.035), (-0.2, 0, t + 0.13), C["strawberry"], segments=5, rings=3))
    parts.append(lpm.prism("bowl", 10, 0.06, 0.08, at=(0.25, -0.12, t), color=C["blue_cloth"], radius_top=0.13))
    for k in range(7):
        a = 2 * math.pi * k / 7
        parts.append(blob(f"berry{k}", (0.032, 0.032, 0.032), (0.25 + 0.07 * math.cos(a), -0.12 + 0.07 * math.sin(a), t + 0.085), C["strawberry"], segments=5, rings=3))
    parts.append(blob("berry_c", (0.035, 0.035, 0.035), (0.25, -0.12, t + 0.1), C["strawberry"], segments=5, rings=3))
    parts.append(fillet(lpm.box("board", (0.26, 0.15, 0.015), at=(0.36, 0.14, t), color=C["wood"]), 0.004))
    for k in range(2):
        parts.append(blob(f"loaf{k}", (0.07, 0.045, 0.04), (0.32 + 0.09 * k, 0.14, t + 0.04), C["bread"], segments=6, rings=4))
    parts.append(lpm.prism("salad", 10, 0.05, 0.07, at=(0.6, -0.04, t), color=C["wood"], radius_top=0.1))
    for k in range(5):
        a = 2 * math.pi * k / 5
        parts.append(leaf_blob(f"salad{k}", (0.6 + 0.05 * math.cos(a), -0.04 + 0.05 * math.sin(a), t + 0.08), 0.04, dark=k % 2 == 0))
    pitcher = lpm.lathe("pitcher", [(0.0, 0), (0.05, 0), (0.07, 0.06), (0.06, 0.15), (0.07, 0.18)], segments=8, at=(-0.55, 0.15, t), color=C["white"])
    lpm.paint(pitcher, C["blue_cloth"], lambda c, n, i: 0.06 + t < c.z < 0.1 + t)
    parts.append(pitcher)
    parts.append(lpm.box("pitcher_handle", (0.02, 0.05, 0.12), at=(-0.6, 0.15, t + 0.03), color=C["white"]))
    pot = vase()
    for p in pot:
        lpm.move(p, -0.52, -0.2, t)
    parts += pot
    for k, (dx, dy, dz, kind) in enumerate(((0, 0, 0.17, "daisy"), (0.04, 0.02, 0.15, "blue"), (-0.04, 0.0, 0.14, "buttercup"), (0.0, -0.04, 0.13, "daisy"))):
        parts.append(lpm.prism(f"vstem{k}", 4, 0.004, dz, at=(-0.52 + dx * 0.5, -0.2 + dy * 0.5, t + 0.08), color=C["green"]))
        parts += flower(f"vase{k}", kind, (-0.52 + dx, -0.2 + dy, t + 0.08 + dz), (dx * 4, dy * 4, 1), 1.0)
    for k, (x, y) in enumerate(((0.62, 0.22), (-0.08, -0.26))):
        parts.append(lpm.prism(f"mug{k}", 8, 0.04, 0.07, at=(x, y, t), color=C["wood"], radius_top=0.036))
    garland_y = -0.58
    for k in range(8):
        x = -0.65 + 0.185 * k
        parts.append(leaf_blob(f"gar{k}", (x, garland_y, 0.37), 0.085, dark=k % 2 == 0))
        if k % 2 == 0:
            parts += flower(f"gar{k}", ["daisy", "blue", "buttercup", "daisy"][(k // 2) % 4], (x, garland_y, 0.42), (0, 0, 1), 1.6)
    return lpm.finish("SM_MS_BanquetTable", parts, P, budget=6500)


# ------------------------------------------------------------------ dala horses
HORSE = [(0.25, 0), (0.15, 0), (0.14, 0.2), (-0.08, 0.2), (-0.1, 0), (-0.2, 0), (-0.22, 0.27), (-0.28, 0.5), (-0.4, 0.55), (-0.41, 0.64), (-0.3, 0.72),
         (-0.27, 0.72), (-0.25, 0.84), (-0.19, 0.73), (-0.1, 0.62), (0.0, 0.44), (0.26, 0.42), (0.29, 0.3), (0.25, 0.2)]
SADDLE = [(-0.05, 0.44), (0.22, 0.42), (0.2, 0.3), (0.0, 0.3)]
MANE = [(-0.19, 0.73), (-0.1, 0.62), (0.0, 0.44), (-0.06, 0.44), (-0.14, 0.6), (-0.22, 0.72)]
BRIDLE = [(-0.4, 0.56), (-0.28, 0.5), (-0.27, 0.56), (-0.4, 0.62)]


def dala_horse(tag, body, main, accent, scale, at, yaw):
    parts = [fillet(lpm.sweep(f"horse{tag}", HORSE, 0.12, color=C[body]), 0.006)]
    for side in (-1, 1):
        y = side * 0.063
        parts.append(lpm.sweep(f"saddle{tag}{side}", SADDLE, 0.008, at=(0, y, 0), color=C[main]))
        parts.append(lpm.sweep(f"mane{tag}{side}", MANE, 0.008, at=(0, y, 0), color=C["white"]))
        parts.append(lpm.sweep(f"bridle{tag}{side}", BRIDLE, 0.008, at=(0, y, 0), color=C[accent]))
        petals = lpm.prism(f"dot{tag}{side}", 8, 0.04, 0.008, color=C["white"])
        centre = lpm.prism(f"dotc{tag}{side}", 6, 0.015, 0.012, at=(0, 0, 0.004), color=C[accent])
        for p in (petals, centre):
            lpm.rotate(p, side * 90, "X")
            lpm.move(p, 0.1, y + side * 0.002, 0.36)
            parts.append(p)
        parts.append(lpm.box(f"eye{tag}{side}", (0.025, 0.012, 0.025), at=(-0.31, y + side * 0.003, 0.63), color=C["black"]))
    for p in parts:
        lpm.scale(p, scale, scale, scale)
        lpm.rotate(p, yaw, "Z")
        lpm.move(p, *at)
    return parts


def dala_horses():
    parts = []
    parts += dala_horse("red", "red", "blue", "yellow", 1.0, (0, -0.72, 0), 0)
    parts += dala_horse("blue", "blue", "yellow", "red", 0.8, (0, 0.0, 0), 8)
    parts += dala_horse("yellow", "yellow", "red", "blue", 0.62, (0, 0.62, 0), -8)
    return lpm.finish("SM_MS_DalaHorses", parts, P, budget=3000)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("totem-1x1", totem_simple, (0.9, 0.9)),
    ("maypole-1x2", maypole, (0.9, 1.9)),
    ("arch-1x2", arch, (0.9, 1.9)),
    ("bonfire-2x2", bonfire, (1.8, 1.8)),
    ("banquet-table-2x2", banquet_table, (1.8, 1.8)),
    ("dala-horses-1x2", dala_horses, (0.9, 1.9)),
]


def fit_footprint(ob, width, depth):
    """Scale uniformly so the bounding box fits the footprint on its tighter axis, then centre it on x and y."""
    me = ob.data
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    s = min(width / (max(xs) - min(xs)), depth / (max(ys) - min(ys)))
    me.transform(Matrix.Scale(s, 4))
    cx = (min(v.co.x for v in me.vertices) + max(v.co.x for v in me.vertices)) / 2
    cy = (min(v.co.y for v in me.vertices) + max(v.co.y for v in me.vertices)) / 2
    me.transform(Matrix.Translation((-cx, -cy, 0)))


out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id, build, (width, depth) in MODELS:
    lpm.reset()
    ob = build()
    fit_footprint(ob, width, depth)
    ob.name = ob.data.name = model_id
    lpm.export_glb(ob, os.path.join(out_dir, model_id, model_id))
