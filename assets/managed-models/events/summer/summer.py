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
    ("sand", "#e8c27a"), ("sand_light", "#f3d99c"), ("sand_dark", "#c99a52"), ("window", "#6e4e2a"),
    ("red", "#e03a3a"), ("white", "#ffffff"), ("white_shade", "#dfe6f2"), ("blue", "#2f6fe0"), ("blue_deep", "#1f4fb0"),
    ("yellow", "#ffd23f"), ("orange", "#ff8a1f"), ("cyan", "#27c4e8"), ("cyan_light", "#8fe3f5"),
    ("wood", "#a8683a"), ("wood_dark", "#6e4222"), ("metal", "#4a4f5c"), ("soil", "#4a3022"),
    ("green", "#3fb83f"), ("green_light", "#7fd84a"), ("trunk", "#b07a45"), ("trunk_dark", "#8a5a30"),
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


def sphere(name, r, centre, color, segments=10, rings=8):
    profile = [(0, 0)] + [(r * math.cos(math.radians(a)), r + r * math.sin(math.radians(a))) for a in range(-90 + 180 // rings, 90, 180 // rings)] + [(0, 2 * r)]
    return lpm.lathe(name, profile, segments=segments, at=(centre[0], centre[1], centre[2] - r), color=color)


def sector(c, n_sectors):
    return int((math.atan2(c.y, c.x) % (2 * math.pi)) / (2 * math.pi / n_sectors))


def cone(name, r, h, at, color, segments=8):
    return fillet(lpm.lathe(name, [(r, 0), (0.0, h)], segments=segments, at=at, color=color), 0.008)


def flag(tag, at):
    x, y, z = at
    return [lpm.prism(f"pole{tag}", 4, 0.008, 0.17, at=at, color=C["wood_dark"], rotate=45),
            lpm.sweep(f"flag{tag}", [(0, 0), (0.12, 0.035), (0, 0.07)], 0.012, at=(x + 0.006, y, z + 0.1), color=C["red"])]


def sand_mound(name, radius, height):
    return fillet(lpm.prism(name, 10, radius, height, color=C["sand"], radius_top=radius * 0.85, rotate=18), 0.01)


# ------------------------------------------------------------------ surfboard
def clip(poly, axis, limit, keep_less):
    out = []
    for i, p in enumerate(poly):
        q = poly[(i + 1) % len(poly)]
        inside_p = (p[axis] <= limit) if keep_less else (p[axis] >= limit)
        inside_q = (q[axis] <= limit) if keep_less else (q[axis] >= limit)
        if inside_p:
            out.append(p)
        if inside_p != inside_q:
            t = (limit - p[axis]) / (q[axis] - p[axis])
            out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
    return out


def surfboard():
    outline = [(-0.09, 0), (0.09, 0), (0.14, 0.3), (0.155, 0.6), (0.115, 0.95), (0.0, 1.25), (-0.115, 0.95), (-0.155, 0.6), (-0.14, 0.3)]
    z_base = 0.07
    tilt = 6
    board = fillet(lpm.sweep("board", outline, 0.05, at=(0, 0, z_base), color=C["white"]), 0.01)
    parts = [board]
    bands = {-1: [(0.0, 0.5, "orange"), (0.5, 0.9, "yellow"), (0.9, 1.3, "orange")],
             1: [(0.0, 0.42, "blue"), (0.42, 0.85, "cyan"), (0.85, 1.3, "cyan_light")]}
    for side, side_bands in bands.items():
        half = clip(outline, 0, -0.02 if side < 0 else 0.02, keep_less=side < 0)
        for k, (z0, z1, colour) in enumerate(side_bands):
            poly = clip(clip(half, 1, z0, keep_less=False), 1, z1, keep_less=True)
            if len(poly) < 3:
                continue
            poly = [(x * 0.93, 0.62 + (z - 0.62) * 0.96) for x, z in poly]
            for face in (-1, 1):
                parts.append(lpm.sweep(f"panel{side}{k}{face}", poly, 0.006, at=(0, face * 0.027, z_base), color=C[colour]))
    for p in parts:
        lpm.rotate(p, tilt, "Y", about=(0, 0, z_base))
    parts.append(sand_mound("mound", 0.4, 0.1))
    return lpm.finish("SM_SU_Surfboard", parts, P, budget=1800)


# ------------------------------------------------------------------ beach ball
def beach_ball():
    r = 0.38
    cz = 0.02 + r
    ball = sphere("ball", r, (0, 0, cz), C["red"], segments=12, rings=8)
    gores = ["red", "white", "blue", "yellow", "white", "blue"]
    lpm.paint(ball, C["red"], lambda c, n, i: True)
    for index, colour in enumerate(gores):
        lpm.paint(ball, C[colour], lambda c, n, i, index=index: sector(c, 6) == index)
    lpm.paint(ball, C["white"], lambda c, n, i: abs(c.z - cz) > r * 0.8)
    parts = [ball,
             lpm.prism("button", 8, 0.06, 0.035, at=(0, 0, cz + r - 0.02), color=C["white_shade"], radius_top=0.05),
             sand_mound("sand", 0.4, 0.04)]
    return lpm.finish("SM_SU_BeachBall", parts, P, budget=900)


# ------------------------------------------------------------------ parasol
def parasol():
    tilt = -12
    pivot = (0, 0, 0.07)
    canopy_z = 0.8
    parts = [lpm.prism("pole", 6, 0.036, 0.88, at=(0, 0, 0.0), color=C["wood"], radius_top=0.03, rotate=30)]
    canopy = lpm.lathe("canopy", [(0.7, 0), (0.6, 0.11), (0.38, 0.2), (0.0, 0.27)], segments=8, at=(0, 0, canopy_z), color=C["red"])
    lpm.paint(canopy, C["white"], lambda c, n, i: sector(c, 8) % 2 == 1)
    parts.append(fillet(canopy, 0.006))
    parts.append(lpm.prism("underside", 8, 0.68, 0.012, at=(0, 0, canopy_z - 0.006), color=C["white_shade"]))
    parts.append(lpm.prism("finial", 6, 0.035, 0.09, at=(0, 0, canopy_z + 0.23), color=C["wood_dark"], radius_top=0.012))
    for p in parts:
        lpm.rotate(p, tilt, "Y", about=pivot)
    parts.append(sand_mound("mound", 0.3, 0.09))
    return lpm.finish("SM_SU_Parasol", parts, P, budget=1200)


# ------------------------------------------------------------------ potted palm
def palm_leaf(tag, length, yaw, droop, colour_in, colour_out):
    k = length / 0.55
    inner = [(0, 0), (0.1 * k, 0.1), (0.28 * k, 0.12), (0.28 * k, -0.12), (0.1 * k, -0.1)]
    outer = [(0.28 * k, 0.12), (0.55 * k, 0), (0.28 * k, -0.12)]
    a = lpm.sweep(f"in{tag}", inner, 0.02, color=colour_in, axis="z")
    b = lpm.sweep(f"out{tag}", outer, 0.02, color=colour_out, axis="z")
    lpm.rotate(b, droop, "Y", about=(0.28 * k, 0, 0))
    for p in (a, b):
        lpm.rotate(p, -22, "Y")
        lpm.rotate(p, yaw, "Z")
    return [a, b]


def potted_palm():
    barrel = lpm.prism("barrel", 10, 0.3, 0.38, color=C["wood"], radius_top=0.34, rotate=18)
    lpm.paint(barrel, C["wood_dark"], lambda c, n, i: abs(n.z) < 0.5 and sector(c, 10) % 2 == 1)
    parts = [fillet(barrel, 0.008),
             lpm.prism("hoop_low", 10, 0.312, 0.04, at=(0, 0, 0.07), color=C["metal"], radius_top=0.318, rotate=18),
             lpm.prism("hoop_high", 10, 0.328, 0.04, at=(0, 0, 0.27), color=C["metal"], radius_top=0.334, rotate=18),
             lpm.prism("soil", 10, 0.325, 0.012, at=(0, 0, 0.375), color=C["soil"], rotate=18)]
    x, z = 0.0, 0.37
    seg = 0.15
    for i in range(6):
        angle = 5 + 3 * i
        radius = 0.08 - 0.006 * i
        piece = lpm.prism(f"trunk{i}", 6, radius, seg * 1.12, color=C["trunk"] if i % 2 else C["trunk_dark"], radius_top=radius - 0.004)
        lpm.rotate(piece, angle, "Y")
        lpm.move(piece, x, 0, z)
        parts.append(piece)
        x += seg * math.sin(math.radians(angle))
        z += seg * math.cos(math.radians(angle))
    crown = (x, 0.0, z)
    for k in range(8):
        length = 0.66 + 0.08 * (k % 2)
        leaf = palm_leaf(k, length, 45 * k + 12, 38 + 8 * (k % 3), C["green_light"], C["green"])
        for p in leaf:
            lpm.move(p, *crown)
        parts += leaf
    parts.append(sphere("heart", 0.05, (crown[0], crown[1], crown[2] + 0.02), C["trunk_dark"], segments=6, rings=4))
    return lpm.finish("SM_SU_PottedPalm", parts, P, budget=1800)


# ------------------------------------------------------------------ sand castle
def crenels(tag, half_w, half_d, at, size, color, n=4):
    x0, y0, z = at
    spots = []
    for i in range(n):
        x = -half_w + 2 * half_w * i / (n - 1)
        spots += [(x, -half_d), (x, half_d)]
    for i in range(1, n - 1):
        y = -half_d + 2 * half_d * i / (n - 1)
        spots += [(-half_w, y), (half_w, y)]
    return [lpm.box(f"{tag}{k}", (size, size, size * 1.1), at=(x0 + x, y0 + y, z), color=color) for k, (x, y) in enumerate(spots)]


def sand_castle():
    parts = [fillet(lpm.prism("base", 10, 0.9, 0.1, color=C["sand_dark"], radius_top=0.8, rotate=18), 0.012)]
    rng = random.Random(4)
    for k, (x, y, r) in enumerate(((-0.72, -0.62, 0.1), (-0.5, -0.78, 0.08), (0.72, -0.6, 0.1), (0.5, -0.8, 0.08), (0.75, 0.3, 0.09), (-0.78, 0.35, 0.1), (0.0, -0.84, 0.07))):
        parts.append(sphere(f"lump{k}", r, (x, y, 0.05 + r * 0.6), C["sand_dark"] if k % 2 else C["sand"], segments=6, rings=4))
    z = 0.1
    parts.append(fillet(lpm.box("wall_front", (1.2, 0.14, 0.3), at=(0, -0.45, z), color=C["sand"]), 0.01))
    parts.append(fillet(lpm.box("wall_back", (1.2, 0.14, 0.3), at=(0, 0.5, z), color=C["sand"]), 0.01))
    for s in (-1, 1):
        parts.append(fillet(lpm.box(f"wall_side{s}", (0.14, 0.95, 0.3), at=(s * 0.6, 0.02, z), color=C["sand"]), 0.01))
    for k in range(7):
        parts.append(lpm.box(f"merlon{k}", (0.1, 0.14, 0.08), at=(-0.45 + 0.15 * k, -0.45, z + 0.3), color=C["sand_light"]))
    parts.append(lpm.box("gate", (0.22, 0.03, 0.18), at=(0, -0.525, z), color=C["window"]))
    arch = lpm.prism("gate_arch", 8, 0.11, 0.03, color=C["window"])
    lpm.rotate(arch, 90, "X")
    parts.append(lpm.move(arch, 0, -0.5, z + 0.18))
    parts.append(fillet(lpm.box("keep", (0.56, 0.56, 0.5), at=(0, 0.2, z), color=C["sand_light"]), 0.01))
    parts += crenels("keep_merlon", 0.25, 0.25, (0, 0.2, z + 0.5), 0.1, C["sand"])
    parts.append(fillet(lpm.box("keep_top", (0.3, 0.3, 0.3), at=(0, 0.2, z + 0.5), color=C["sand_light"]), 0.01))
    parts.append(cone("keep_roof", 0.25, 0.3, (0, 0.2, z + 0.8), C["sand_dark"]))
    parts += flag("keep", (0, 0.2, z + 1.09))
    for s in (-1, 1):
        parts.append(lpm.box(f"keep_window{s}", (0.07, 0.02, 0.13), at=(s * 0.12, -0.09, z + 0.28), color=C["window"]))
    parts.append(lpm.box("top_window", (0.07, 0.02, 0.11), at=(0, 0.04, z + 0.6), color=C["window"]))
    towers = [("tl", (-0.6, -0.45), 0.19, 0.58), ("tr", (0.6, -0.45), 0.16, 0.44), ("tb", (0.6, 0.5), 0.14, 0.36)]
    for tag, (x, y), r, h in towers:
        parts.append(fillet(lpm.prism(f"tower_{tag}", 8, r, h, at=(x, y, z), color=C["sand"], radius_top=r * 0.9, rotate=22.5), 0.008))
        parts.append(cone(f"roof_{tag}", r * 1.2, h * 0.5, (x, y, z + h), C["sand_dark"]))
        parts += flag(tag, (x, y, z + h + h * 0.5 - 0.01))
        parts.append(lpm.box(f"window_{tag}", (0.05, 0.02, 0.1), at=(x, y - r * 0.9, z + h * 0.55), color=C["window"]))
    return lpm.finish("SM_SU_SandCastle", parts, P, budget=3800)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("surfboard-1x1", surfboard, (0.9, 0.9)),
    ("sand-castle-2x2", sand_castle, (1.8, 1.8)),
    ("potted-palm-1x1", potted_palm, (0.9, 0.9)),
    ("parasol-1x1", parasol, (0.9, 0.9)),
    ("beach-ball-1x1", beach_ball, (0.9, 0.9)),
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
