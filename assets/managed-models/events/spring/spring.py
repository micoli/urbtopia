import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("cream", "#f4ead0"), ("cream_shade", "#d8c9a2"), ("stone", "#e8dcc2"), ("stone_shade", "#c9bb9d"),
    ("wood_light", "#d9a066"), ("wood", "#a8683a"), ("wood_dark", "#6e4222"), ("soil", "#5a3a28"),
    ("roof", "#d9453a"), ("roof_dark", "#a82f2a"),
    ("grass", "#4fb83d"), ("grass_dark", "#2f8f34"), ("grass_light", "#7fd150"), ("stem", "#3f9a3a"),
    ("pink", "#ff6fa5"), ("pink_dark", "#d94a86"), ("purple", "#7a3fc0"), ("purple_dark", "#4b2a90"),
    ("yellow", "#ffd23f"), ("orange", "#f28a1c"), ("white", "#ffffff"),
    ("blue", "#3d7fe0"), ("blue_dark", "#2a58b0"), ("belly", "#f08a3c"), ("coal", "#26262e"), ("beak", "#f2a31c"),
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


def ball(name, r, centre, color, segments=8):
    profile = [(0, 0)] + [(r * math.cos(math.radians(a)), r + r * math.sin(math.radians(a))) for a in (-60, -30, 0, 30, 60)] + [(0, 2 * r)]
    return lpm.lathe(name, profile, segments=segments, at=(centre[0], centre[1], centre[2] - r), color=color)


def place(parts, at, tilt=0, yaw=0, size=1.0):
    """Size, tilt (about X) then turn (about Z) parts built upright at the origin, then move them."""
    for p in parts:
        if size != 1.0:
            lpm.scale(p, size, size, size)
        if tilt:
            lpm.rotate(p, tilt, "X")
        if yaw:
            lpm.rotate(p, yaw, "Z")
        lpm.move(p, *at)
    return parts


def leaf(name, length, width, color, lean, yaw):
    outline = [(0, 0), (width, length * 0.3), (width * 0.6, length * 0.7), (0, length), (-width * 0.6, length * 0.7), (-width, length * 0.3)]
    part = lpm.sweep(name, outline, 0.008, color=color)
    lpm.rotate(part, lean, "Y")
    lpm.rotate(part, yaw, "Z")
    return part


def tuft(tag, at, blades=4, height=0.14, seed=0):
    rng = random.Random(seed)
    parts = []
    for k in range(blades):
        yaw = 360 * k / blades + rng.uniform(-20, 20)
        part = leaf(f"{tag}{k}", height * rng.uniform(0.75, 1.1), 0.022, C["grass_light"] if k % 2 else C["grass"], rng.uniform(14, 34), yaw)
        parts.append(lpm.move(part, *at))
    return parts


def stem(tag, height, at=(0, 0, 0)):
    return lpm.prism(f"stem{tag}", 4, 0.007, height, at=at, color=C["stem"], rotate=45)


def tulip(tag, color, dark, height=0.22, with_leaves=True):
    cup = [(0, 0), (0.028, 0.012), (0.04, 0.05), (0.032, 0.085), (0.012, 0.1), (0, 0.108)]
    head = lpm.lathe(f"tulip{tag}", cup, segments=6, at=(0, 0, height), color=color)
    lpm.paint(head, dark, lambda c, n, i: i % 2 == 1)
    parts = [stem(tag, height + 0.01), head]
    if with_leaves:
        for k, yaw in enumerate((20, 200)):
            parts.append(leaf(f"tl{tag}{k}", height * 0.95, 0.03, C["stem"], 28, yaw))
    return parts


PANSY_PETAL = [(0, 0), (0.03, 0.012), (0.038, 0.04), (0.0, 0.05), (-0.038, 0.04), (-0.03, 0.012)]
DAISY_PETAL = [(-0.011, 0.008), (0.011, 0.008), (0.014, 0.05), (0, 0.062), (-0.014, 0.05)]


def pansy(tag, main, accent, centre):
    parts = []
    for k in range(5):
        petal = lpm.sweep(f"pp{tag}{k}", PANSY_PETAL, 0.008, at=(0, 0, 0.002 * (k % 2)), color=main if k < 4 else accent, axis="z")
        parts.append(lpm.rotate(petal, 72 * k, "Z"))
    parts.append(lpm.prism(f"pc{tag}", 6, 0.012, 0.014, at=(0, 0, 0.004), color=centre))
    return parts


def daisy(tag, with_stem=True, height=0.2):
    parts = []
    for k in range(8):
        petal = lpm.sweep(f"dp{tag}{k}", DAISY_PETAL, 0.007, at=(0, 0, 0.002 * (k % 2)), color=C["white"], axis="z")
        parts.append(lpm.rotate(petal, 45 * k, "Z"))
    parts.append(lpm.prism(f"dc{tag}", 6, 0.02, 0.014, at=(0, 0, 0.004), color=C["yellow"]))
    if with_stem:
        for p in parts:
            lpm.move(p, 0, 0, height)
        parts.append(stem(f"d{tag}", height + 0.004))
    return parts


# ------------------------------------------------------------------ fence with flowers
def fence():
    parts = []
    heights = [0.5, 0.46, 0.5, 0.48, 0.5, 0.46, 0.5]
    for k, h in enumerate(heights):
        x = -0.42 + 0.14 * k
        outline = [(-0.045, 0), (0.045, 0), (0.045, h - 0.07), (0, h), (-0.045, h - 0.07)]
        picket = lpm.sweep(f"picket{k}", outline, 0.035, at=(x, -0.004, 0.0), color=C["cream"])
        parts.append(fillet(picket, 0.007))
    for k, z in enumerate((0.12, 0.31)):
        rail = lpm.box(f"rail{k}", (1.0, 0.03, 0.05), at=(0, 0.02, z), color=C["cream_shade"])
        parts.append(fillet(rail, 0.006))
    flowers = [
        (tulip("a", C["pink"], C["pink_dark"], 0.2), (-0.4, -0.08, 0.0), 14, -8),
        (tulip("b", C["pink"], C["pink_dark"], 0.26), (-0.3, -0.1, 0.0), 8, 16),
        (tulip("c", C["purple"], C["purple_dark"], 0.22), (0.3, -0.09, 0.0), 10, -12),
        (tulip("d", C["pink"], C["pink_dark"], 0.16, False), (0.04, -0.11, 0.0), 6, 4),
        (daisy("a", height=0.2), (0.4, -0.08, 0.0), 10, 20),
        (daisy("b", height=0.14), (0.36, -0.12, 0.0), 8, -30),
    ]
    for flower, at, tilt, yaw in flowers:
        parts += place(flower, at, tilt, yaw, size=1.5)
    for k, x in enumerate((-0.46, -0.2, 0.0, 0.2, 0.46)):
        parts += tuft(f"tuft{k}", (x, -0.06 - 0.02 * (k % 2), 0.0), blades=4, height=0.15, seed=k)
    return lpm.finish("SM_SP_Fence", parts, P, budget=2600)


# ------------------------------------------------------------------ bird house on a post with a bluebird
def bluebird():
    body = ball("body", 0.05, (0, 0, 0.07), C["blue"])
    lpm.scale(body, 0.9, 1.3, 1.0, about=(0, 0, 0.07))
    lpm.paint(body, C["belly"], lambda c, n, i: c.z < 0.065)
    head = ball("head", 0.034, (0, -0.052, 0.12), C["blue"])
    beak = lpm.prism("beak", 3, 0.012, 0.03, at=(0, 0, 0), color=C["beak"], radius_top=0.002)
    lpm.rotate(beak, 90, "X")
    lpm.move(beak, 0, -0.082, 0.118)
    parts = [body, head, beak]
    for s in (-1, 1):
        parts.append(lpm.box(f"eye{s}", (0.01, 0.01, 0.01), at=(s * 0.026, -0.07, 0.125), color=C["coal"]))
        wing = lpm.box(f"wing{s}", (0.012, 0.09, 0.05), at=(s * 0.046, 0.01, 0.045), color=C["blue_dark"], taper=(1.0, 0.5))
        parts.append(wing)
        parts.append(lpm.prism(f"foot{s}", 4, 0.005, 0.03, at=(s * 0.016, -0.005, 0.0), color=C["beak"], rotate=45))
    tail = lpm.box("tail", (0.045, 0.08, 0.012), at=(0, 0.08, 0.07), color=C["blue_dark"], taper=(1.3, 1.0))
    parts.append(lpm.rotate(tail, 14, "X", about=(0, 0.05, 0.07)))
    return parts


def birdhouse():
    parts = [fillet(lpm.prism("mound", 8, 0.46, 0.05, color=C["grass"], radius_top=0.42, rotate=22.5), 0.008)]
    parts.append(fillet(lpm.box("post", (0.09, 0.09, 0.4), at=(0, 0, 0.04), color=C["wood"]), 0.006))
    body_z, body_h = 0.4, 0.36
    parts.append(fillet(lpm.box("body", (0.34, 0.3, body_h), at=(0, 0, body_z), color=C["cream"]), 0.008))
    top = body_z + body_h
    parts.append(lpm.sweep("gable", [(-0.17, 0), (0.17, 0), (0, 0.12)], 0.3, at=(0, 0, top), color=C["cream"]))
    chevron = [(-0.28, 0), (0, 0.19), (0.28, 0), (0.28, -0.035), (0, 0.155), (-0.28, -0.035)]
    parts.append(fillet(lpm.sweep("roof", chevron, 0.4, at=(0, 0, top - 0.035), color=C["roof"]), 0.006))
    parts.append(lpm.box("ridge", (0.035, 0.4, 0.02), at=(0, 0, top + 0.15), color=C["roof_dark"]))
    rim = lpm.prism("rim", 8, 0.08, 0.012, color=C["wood_dark"])
    hole = lpm.prism("hole", 8, 0.06, 0.02, color=C["coal"])
    perch = lpm.prism("perch", 5, 0.009, 0.07, color=C["wood"])
    for p, (y, z) in ((rim, (-0.14, top - 0.13)), (hole, (-0.14, top - 0.13)), (perch, (-0.14, top - 0.24))):
        lpm.rotate(p, 90, "X")
        lpm.move(p, 0, y, z)
        parts.append(p)
    rng = random.Random(3)
    for k in range(6):
        side = -1 if k % 2 else 1
        z = 0.1 + 0.045 * k
        vine = leaf(f"ivy{k}", 0.085, 0.04, C["grass_dark"] if k % 2 else C["stem"], 70 * side, 0)
        lpm.rotate(vine, 90, "X")
        lpm.rotate(vine, rng.uniform(-30, 30), "Y")
        lpm.move(vine, side * 0.035, -0.047, z)
        parts.append(vine)
    flowers = [
        (tulip("a", C["pink"], C["pink_dark"], 0.2), (0.26, -0.18, 0.04), 12, 10),
        (tulip("b", C["purple"], C["purple_dark"], 0.17), (-0.25, -0.2, 0.04), 10, -14),
        (daisy("a", height=0.14), (-0.3, 0.06, 0.04), 8, 30),
        (daisy("b", height=0.12), (0.3, 0.08, 0.04), 8, -20),
    ]
    for flower, at, tilt, yaw in flowers:
        parts += place(flower, at, tilt, yaw, size=1.5)
    for k, (x, y) in enumerate(((-0.12, -0.3), (0.12, -0.31), (-0.3, -0.16), (0.3, 0.2), (0.0, 0.31))):
        parts += tuft(f"tuft{k}", (x, y, 0.04), blades=4, height=0.14, seed=k)
    parts += place(bluebird(), (0, 0, top + 0.15), size=1.5)
    return lpm.finish("SM_SP_Birdhouse", parts, P, budget=3200)


# ------------------------------------------------------------------ flower box
def flower_box():
    body = fillet(lpm.box("box", (0.9, 0.4, 0.3), at=(0, 0, 0.0), color=C["stone"]), 0.012)
    lpm.paint(body, C["stone_shade"], lambda c, n, i: abs(n.z) < 0.5 and c.z < 0.06)
    parts = [body]
    for s in (-1, 1):
        parts.append(fillet(lpm.box(f"foot{s}", (0.12, 0.43, 0.05), at=(s * 0.33, 0, 0.0), color=C["stone_shade"]), 0.008))
    lip = fillet(lpm.box("lip", (0.94, 0.44, 0.04), at=(0, 0, 0.26), color=C["stone"]), 0.01)
    parts.append(lip)
    parts.append(lpm.box("soil", (0.84, 0.34, 0.02), at=(0, 0, 0.298), color=C["soil"]))
    rng = random.Random(7)
    colours = [("purple", "purple_dark", "yellow"), ("yellow", "orange", "coal"), ("white", "purple", "yellow"), ("purple_dark", "purple", "yellow")]
    slot = 0
    for ix, x in enumerate((-0.34, -0.17, 0.0, 0.17, 0.34)):
        for iy, y in enumerate((-0.085, 0.085)):
            main, accent, centre = colours[slot % len(colours)]
            slot += 1
            head = pansy(f"{ix}{iy}", C[main], C[accent], C[centre])
            parts += place(head, (x + rng.uniform(-0.02, 0.02), y + rng.uniform(-0.015, 0.015), 0.38 + 0.03 * rng.random()), 35 if y < 0 else 20, rng.uniform(-25, 25), size=1.7)
    for k in range(10):
        a = 36 * k + rng.uniform(-8, 8)
        x = 0.36 * math.cos(math.radians(a)) * 1.1
        y = 0.12 * math.sin(math.radians(a)) * 1.2
        lf = leaf(f"lf{k}", 0.14, 0.045, C["grass_dark"] if k % 2 else C["grass"], rng.uniform(60, 80), a)
        parts.append(lpm.move(lf, x, y, 0.3))
    for k, x in enumerate((-0.2, 0.08, 0.3)):
        parts += place(daisy(f"b{k}", height=0.16 + 0.03 * k), (x, 0.02 * (-1) ** k, 0.3), 6, 20 * k, size=1.5)
    return lpm.finish("SM_SP_FlowerBox", parts, P, budget=3200)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("fence-1x1", fence, (0.9, 0.9)),
    ("birdhouse-1x1", birdhouse, (0.9, 0.9)),
    ("flower-box-1x1", flower_box, (0.9, 0.9)),
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
