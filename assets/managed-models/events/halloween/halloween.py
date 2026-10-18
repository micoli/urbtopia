import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("orange", "#ff8a1f"), ("orange_dark", "#f06a10"), ("green", "#62b82c"), ("glow", "#ffd23a", 0, 0.5, 2.5),
    ("white", "#f6f6fc"), ("ghost_shade", "#cfd2ea"), ("eye", "#1c1c26"), ("purple", "#6a3fb0"),
    ("purple_dark", "#4a2a82"), ("band", "#ff8f1f"), ("gold", "#f4b82e", 0.6, 0.4), ("black", "#26262e"),
    ("iron", "#454556"), ("iron_light", "#5d5d72"), ("slime", "#7bff3a", 0, 0.4, 1.6), ("bubble", "#b6ff7a", 0, 0.4, 1.8),
    ("stone", "#9a9db0"), ("stone_dark", "#707388"), ("grass", "#4f9e38"), ("grass_dark", "#3a7a2c"),
    ("dirt", "#5a4636"), ("wood", "#7a4a28"), ("wall", "#2a2a3a"), ("roof", "#4a3478"),
    ("window", "#ffa31f", 0, 0.5, 2.5), ("base", "#55556b"), ("path", "#8a8aa0"), ("roof_dark", "#382660"),
])
C = {n: P[n] for n, *_ in P.entries}


def sector(c, n_sectors):
    return int((math.atan2(c.y, c.x) % (2 * math.pi)) / (2 * math.pi / n_sectors))


def inlay(ob, radius_at, proud, depth):
    """Make a flat swept shape hug a vertical surface: front verts sit `proud` outside, back verts sink `depth` inside."""
    for v in ob.data.vertices:
        surface = -math.sqrt(max(radius_at(v.co.z) ** 2 - v.co.x ** 2, 1e-4))
        v.co.y = surface - proud if v.co.y < 0 else surface + depth
    ob.data.update()
    return ob


def interp(profile, z):
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        if z0 <= z <= z1 and z1 > z0:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return profile[-1][0]


def fillet(ob, width, color, segments=2, min_angle=0.35):
    """Round the sharp edges of a single-coloured part; coplanar triangulation diagonals are left alone."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > min_angle]
    bmesh.ops.bevel(bm, geom=edges, offset=width, segments=segments, affect="EDGES")
    layer = bm.faces.layers.int["lpm_color"]
    for f in bm.faces:
        f[layer] = color
        f.smooth = False
    bm.to_mesh(ob.data)
    bm.free()
    return ob


def sphere(name, r, at, color):
    return lpm.lathe(name, [(0, 0), (0.75 * r, 0.25 * r), (r, r), (0.75 * r, 1.75 * r), (0, 2 * r)], segments=6, at=at, color=color)


# ------------------------------------------------------------------ pumpkin
def pumpkin():
    prof = [(0.0, 0.01), (0.22, 0.0), (0.38, 0.08), (0.46, 0.22), (0.46, 0.32), (0.38, 0.44), (0.18, 0.50), (0.08, 0.47), (0.0, 0.43)]
    body = lpm.lathe("body", prof, segments=16, color=C["orange"])
    for v in body.data.vertices:
        if abs(v.co.x) + abs(v.co.y) < 1e-6:
            continue
        k = round((math.atan2(v.co.y, v.co.x) % (2 * math.pi)) / (2 * math.pi / 16)) % 16
        f = 1.0 + (0.045 if k % 2 == 0 else -0.045)
        v.co.x *= f; v.co.y *= f
    lpm.paint(body, C["orange_dark"], lambda c, n, i: sector(c, 16) % 2 == 1)
    stem = lpm.prism("stem", 5, 0.075, 0.18, at=(0, 0, 0.40), color=C["green"], radius_top=0.045)
    for v in stem.data.vertices:
        v.co.x += 0.06 * max(v.co.z - 0.40, 0) ** 1 * 1.2
    stem.data.update()
    R = lambda z: interp(prof, z) * 1.0
    parts = [body, stem]
    for sx in (-1, 1):
        eye = lpm.sweep("eye", [(sx * 0.21, 0), (sx * 0.08, 0), (sx * 0.15, 0.11)], 0.06, at=(0, 0, 0.29), color=C["glow"])
        parts.append(inlay(eye, R, 0.02, 0.05))
    nose = lpm.sweep("nose", [(-0.035, 0), (0.035, 0), (0, 0.06)], 0.06, at=(0, 0, 0.25), color=C["glow"])
    mouth = lpm.sweep("mouth", [(-0.26, 0.14), (-0.15, 0.10), (-0.08, 0.13), (0, 0.10), (0.08, 0.13), (0.15, 0.10), (0.26, 0.14),
                                (0.2, 0.04), (0.1, 0.0), (0, 0.03), (-0.1, 0.0), (-0.2, 0.04)], 0.06, at=(0, 0, 0.09), color=C["glow"])
    parts += [inlay(nose, R, 0.02, 0.05), inlay(mouth, R, 0.02, 0.05)]
    return lpm.finish("SM_HW_Pumpkin", parts, P, budget=800)


# ------------------------------------------------------------------ witch hat
def witch_hat():
    brim = lpm.lathe("brim", [(0.28, 0.0), (0.62, 0.0), (0.62, 0.04), (0.28, 0.07)], segments=12, color=C["purple"])
    cone = lpm.lathe("cone", [(0.30, 0.03), (0.28, 0.14), (0.2, 0.35), (0.12, 0.55), (0.05, 0.72), (0.0, 0.8)], segments=12, color=C["purple"])
    for v in cone.data.vertices:
        t = max(v.co.z - 0.3, 0)
        v.co.x += 0.9 * t * t
        v.co.z -= 0.25 * t * t
    cone.data.update()
    lpm.paint(cone, C["purple_dark"], lambda c, n, i: sector(c, 12) % 2 == 1)
    band = lpm.prism("band", 12, 0.315, 0.1, at=(0, 0, 0.06), color=C["band"], radius_top=0.285)
    parts = [brim, cone, band]
    parts.append(lpm.box("b_top", (0.17, 0.04, 0.03), at=(0, -0.31, 0.15), color=C["gold"]))
    parts.append(lpm.box("b_bot", (0.17, 0.04, 0.03), at=(0, -0.31, 0.06), color=C["gold"]))
    parts.append(lpm.box("b_l", (0.03, 0.04, 0.12), at=(-0.07, -0.31, 0.06), color=C["gold"]))
    parts.append(lpm.box("b_r", (0.03, 0.04, 0.12), at=(0.07, -0.31, 0.06), color=C["gold"]))
    return lpm.finish("SM_HW_WitchHat", parts, P, budget=800)


# ------------------------------------------------------------------ cauldron
def cauldron():
    prof = [(0.12, 0.0), (0.3, 0.04), (0.44, 0.2), (0.48, 0.36), (0.44, 0.48), (0.5, 0.5), (0.5, 0.57), (0.4, 0.57), (0.4, 0.5)]
    body = lpm.lathe("pot", prof, segments=10, at=(0, 0, 0.1), color=C["black"])
    lpm.paint(body, C["iron_light"], lambda c, n, i: c.z > 0.66)
    parts = [body]
    for k in range(3):
        a = math.radians(90 + 120 * k)
        parts.append(lpm.prism(f"leg{k}", 4, 0.08, 0.17, at=(0.3 * math.cos(a), 0.3 * math.sin(a), 0), color=C["iron"], radius_top=0.05, rotate=45))
    parts.append(lpm.prism("slime", 10, 0.395, 0.03, at=(0, 0, 0.59), color=C["slime"]))
    for nm, r, x, y, z in (("b1", 0.07, -0.12, -0.05, 0.64), ("b2", 0.05, 0.15, 0.1, 0.70), ("b3", 0.045, 0.02, -0.16, 0.80), ("b4", 0.035, 0.2, -0.12, 0.92)):
        parts.append(sphere(nm, r, (x, y, z), C["bubble"]))
    for sx in (1, -1):
        ring = lpm.prism("ring", 8, 0.1, 0.05, at=(0, 0, 0), color=C["iron_light"])
        hole = lpm.prism("hole", 8, 0.05, 0.056, at=(0, 0, -0.003), color=C["eye"])
        for p in (ring, hole):
            lpm.rotate(p, 90 * sx, "Y")
            lpm.move(p, sx * 0.47, 0, 0.5)
            parts.append(p)
    return lpm.finish("SM_HW_Cauldron", parts, P, budget=900)


# ------------------------------------------------------------------ ghost
def ghost(arms_forward=False):
    prof = [(0.34, 0.0), (0.37, 0.15), (0.32, 0.45), (0.30, 0.7), (0.30, 0.85), (0.22, 0.98), (0.0, 1.05)]
    body = lpm.lathe("sheet", prof, segments=10, color=C["white"])
    for v in body.data.vertices[:10]:
        k = round((math.atan2(v.co.y, v.co.x) % (2 * math.pi)) / (2 * math.pi / 10)) % 10
        if k % 2 == 1:
            v.co.z += 0.12
    lpm.paint(body, C["ghost_shade"], lambda c, n, i: c.z < 0.25 and sector(c, 10) % 2 == 0)
    if arms_forward:
        parts = [body]
        for sx in (-1, 1):
            arm = lpm.prism("arm", 5, 0.075, 0.42, at=(sx * 0.24, -0.1, 0.5), color=C["white"], radius_top=0.055)
            parts.append(lpm.rotate(arm, 78, "X", about=(sx * 0.24, -0.1, 0.5)))
    else:
        arm = lpm.sweep("arm", [(0.22, 0.40), (0.38, 0.52), (0.52, 0.74), (0.58, 0.88), (0.48, 0.90), (0.36, 0.72), (0.22, 0.62)], 0.18, color=C["white"])
        parts = [body, arm, lpm.mirror_x(arm)]
    R = lambda z: interp(prof, z) * math.cos(math.pi / 10)
    hexa = lambda cx, w, h: [(cx, -h), (cx + w, -h / 2), (cx + w, h / 2), (cx, h), (cx - w, h / 2), (cx - w, -h / 2)]
    for sx in (-1, 1):
        parts.append(inlay(lpm.sweep("eye", hexa(0, 0.035, 0.065), 0.04, at=(sx * 0.07, 0, 0.84), color=C["eye"]), R, 0.012, 0.04))
    parts.append(inlay(lpm.sweep("mouth", hexa(0, 0.045, 0.06), 0.04, at=(0, 0, 0.66), color=C["eye"]), R, 0.012, 0.04))
    return lpm.finish("SM_HW_Ghost", parts, P, budget=800)


# ------------------------------------------------------------------ graveyard
def graveyard():
    parts = []
    arch = [(-0.2, 0), (0.2, 0), (0.2, 0.45), (0.18, 0.54), (0.12, 0.6), (0, 0.63), (-0.12, 0.6), (-0.18, 0.54), (-0.2, 0.45)]
    sy = -0.1
    s1 = fillet(lpm.sweep("stone1", arch, 0.1, at=(-0.45, sy, 0.1), color=C["stone"]), 0.015, C["stone"])
    c1 = lpm.box("cv", (0.045, 0.025, 0.24), at=(-0.45, sy - 0.0625, 0.3), color=C["stone_dark"])
    c2 = lpm.box("ch", (0.15, 0.025, 0.045), at=(-0.45, sy - 0.0625, 0.42), color=C["stone_dark"])
    for p in (s1, c1, c2):
        lpm.rotate(p, 6, "Y", about=(-0.45, sy, 0.1)); parts.append(p)
    s2v = fillet(lpm.box("cross_v", (0.14, 0.1, 0.62), at=(0.55, -0.15, 0.1), color=C["stone"]), 0.015, C["stone"])
    s2h = fillet(lpm.box("cross_h", (0.4, 0.1, 0.13), at=(0.55, -0.15, 0.4), color=C["stone"]), 0.015, C["stone"])
    for p in (s2v, s2h):
        lpm.rotate(p, -5, "Y", about=(0.55, -0.15, 0.1)); parts.append(p)
    s3 = fillet(lpm.sweep("stone3", [(-0.22, 0), (0.22, 0), (0.22, 0.3), (0.1, 0.4), (-0.22, 0.34)], 0.1, at=(0.05, 0.2, 0.1), color=C["stone_dark"]), 0.015, C["stone_dark"])
    parts.append(s3)
    parts.append(lpm.box("mound", (0.5, 0.5, 0.14), at=(0.05, 0.05, 0.1), color=C["dirt"], taper=(0.6, 0.6)))
    parts.append(lpm.box("wc_v", (0.05, 0.05, 0.34), at=(0.85, 0.1, 0.1), color=C["wood"]))
    parts.append(lpm.box("wc_h", (0.2, 0.05, 0.05), at=(0.85, 0.1, 0.28), color=C["wood"]))
    parts.append(lpm.prism("trunk", 6, 0.07, 0.8, at=(-0.78, 0.22, 0.1), color=C["wood"], radius_top=0.03))
    for k, (ang, z0, ln) in enumerate(((40, 0.55, 0.35), (-35, 0.7, 0.3), (25, 0.85, 0.25))):
        br = lpm.prism(f"br{k}", 5, 0.035, ln, at=(-0.78, 0.22, z0), color=C["wood"], radius_top=0.01)
        lpm.rotate(br, ang, "Y", about=(-0.78, 0.22, z0)); parts.append(br)
    xs = [-0.9 + 0.225 * i for i in range(9)]
    for i, x in enumerate(xs):
        parts.append(lpm.box(f"post{i}", (0.045, 0.045, 0.3), at=(x, 0.4, 0.1), color=C["iron"], taper=(0.2, 0.2)))
    parts.append(lpm.box("rail1", (1.8, 0.025, 0.03), at=(0, 0.4, 0.17), color=C["iron"]))
    parts.append(lpm.box("rail2", (1.8, 0.025, 0.03), at=(0, 0.4, 0.30), color=C["iron"]))
    for i, (x, y) in enumerate(((-0.9, -0.38), (0.9, -0.2), (-0.1, -0.4), (0.3, -0.4))):
        parts.append(lpm.prism(f"tuft{i}", 4, 0.06, 0.16, at=(x, y, 0.1), color=C["grass_dark"], radius_top=0.005))
    return lpm.finish("SM_HW_Graveyard", parts, P, budget=1500)


# ------------------------------------------------------------------ haunted manor
def window(parts, tag, x, y, z, w, h):
    parts.append(lpm.box(f"wf{tag}", (w + 0.04, 0.03, h + 0.04), at=(x, y, z - 0.02), color=C["iron"]))
    parts.append(lpm.box(f"wg{tag}", (w, 0.04, h), at=(x, y, z), color=C["window"]))
    parts.append(lpm.box(f"wv{tag}", (0.02, 0.05, h), at=(x, y, z), color=C["iron"]))
    parts.append(lpm.box(f"wh{tag}", (w, 0.05, 0.02), at=(x, y, z + h / 2 - 0.01), color=C["iron"]))


def manor():
    parts = []
    parts.append(fillet(lpm.box("main", (1.3, 0.9, 0.8), at=(0, 0.1, 0.1), color=C["wall"]), 0.02, C["wall"]))
    roof = lpm.sweep("roof", [(-0.58, 0), (0.58, 0), (0.0, 0.5)], 1.5, at=(0, 0, 0.9), color=C["roof"])
    lpm.rotate(roof, 90, "Z"); lpm.move(roof, 0, 0.1, 0); parts.append(roof)
    parts.append(fillet(lpm.box("front", (0.6, 0.5, 0.85), at=(0, -0.4, 0.1), color=C["wall"]), 0.02, C["wall"]))
    parts.append(lpm.sweep("groof", [(-0.4, 0), (0.4, 0), (0, 0.4)], 0.55, at=(0, -0.425, 0.95), color=C["roof_dark"]))
    parts.append(lpm.sweep("gwall", [(-0.3, 0), (0.3, 0), (0, 0.3)], 0.02, at=(0, -0.695, 0.95), color=C["wall"]))
    parts.append(lpm.box("door", (0.2, 0.03, 0.4), at=(0, -0.66, 0.1), color=C["purple_dark"]))
    parts.append(lpm.box("knob", (0.025, 0.04, 0.025), at=(0.06, -0.665, 0.3), color=C["gold"]))
    window(parts, "gable", 0, -0.66, 0.62, 0.14, 0.2)
    parts.append(fillet(lpm.box("lt", (0.42, 0.42, 1.3), at=(-0.82, -0.1, 0.1), color=C["wall"]), 0.02, C["wall"]))
    parts.append(lpm.box("lt_roof", (0.58, 0.58, 0.6), at=(-0.82, -0.1, 1.4), color=C["roof"], taper=(0.02, 0.02)))
    window(parts, "lt1", -0.82, -0.31, 0.95, 0.1, 0.22)
    window(parts, "lt2", -0.82, -0.31, 0.42, 0.1, 0.22)
    parts.append(fillet(lpm.box("rt", (0.34, 0.34, 1.6), at=(0.85, 0.25, 0.1), color=C["wall"]), 0.02, C["wall"]))
    parts.append(lpm.box("rt_roof", (0.48, 0.48, 0.75), at=(0.85, 0.25, 1.7), color=C["roof_dark"], taper=(0.02, 0.02)))
    window(parts, "rt1", 0.85, 0.08, 1.15, 0.09, 0.24)
    window(parts, "rt2", 0.85, 0.08, 0.62, 0.09, 0.24)
    for i, x in enumerate((-0.42, 0.42)):
        window(parts, f"m{i}a", x, -0.35, 0.25, 0.14, 0.22)
        window(parts, f"m{i}b", x, -0.35, 0.6, 0.14, 0.22)
    parts.append(lpm.box("chimney", (0.14, 0.14, 0.5), at=(0.35, 0.3, 1.1), color=C["iron"]))
    parts.append(lpm.box("path", (0.3, 0.6, 0.02), at=(0, -1.0, 0.1), color=C["path"]))
    parts.append(lpm.box("step", (0.4, 0.14, 0.05), at=(0, -0.76, 0.1), color=C["base"]))
    FY = 1.25
    xs = [round(-1.3 + 0.2 * i, 2) for i in range(14)]
    for i, x in enumerate(xs):
        parts.append(lpm.box(f"bp{i}", (0.045, 0.045, 0.28), at=(x, FY, 0.1), color=C["iron"], taper=(0.2, 0.2)))
        if abs(x) < 0.25:
            continue
        parts.append(lpm.box(f"fp{i}", (0.045, 0.045, 0.28), at=(x, -FY, 0.1), color=C["iron"], taper=(0.2, 0.2)))
    for z, tag in ((0.17, "a"), (0.29, "b")):
        parts.append(lpm.box(f"br{tag}", (2.6, 0.025, 0.03), at=(0, FY, z), color=C["iron"]))
        parts.append(lpm.box(f"fl{tag}", (1.0, 0.025, 0.03), at=(-0.8, -FY, z), color=C["iron"]))
        parts.append(lpm.box(f"fr{tag}", (1.0, 0.025, 0.03), at=(0.8, -FY, z), color=C["iron"]))
    for i, y in enumerate([round(-1.05 + 0.3 * k, 2) for k in range(8)]):
        for sx in (-1, 1):
            parts.append(lpm.box(f"sp{i}{sx}", (0.045, 0.045, 0.28), at=(sx * 1.3, y, 0.1), color=C["iron"], taper=(0.2, 0.2)))
    for sx in (-1, 1):
        for z, tag in ((0.17, "a"), (0.29, "b")):
            parts.append(lpm.box(f"sr{tag}{sx}", (0.025, 2.1, 0.03), at=(sx * 1.3, 0, z), color=C["iron"]))
    trunk = lpm.prism("trunk2", 6, 0.06, 0.6, at=(-1.0, 0.85, 0.1), color=C["wood"], radius_top=0.025)
    parts.append(trunk)
    for k, (ang, z0, ln) in enumerate(((40, 0.4, 0.3), (-35, 0.5, 0.28))):
        br = lpm.prism(f"tb{k}", 5, 0.03, ln, at=(-1.0, 0.85, z0), color=C["wood"], radius_top=0.008)
        lpm.rotate(br, ang, "Y", about=(-1.0, 0.85, z0)); parts.append(br)
    trunk = lpm.prism("trunk", 6, 0.06, 0.6, at=(1.0, -0.6, 0.1), color=C["wood"], radius_top=0.025)
    parts.append(trunk)
    for k, (ang, z0, ln) in enumerate(((50, 0.4, 0.32), (-55, 0.5, 0.3))):
        br = lpm.prism(f"br{k}", 5, 0.03, ln, at=(1.0, -0.6, z0), color=C["wood"], radius_top=0.008)
        lpm.rotate(br, ang, "Y", about=(1.0, -0.6, z0)); parts.append(br)
    return lpm.finish("SM_HW_HauntedManor", parts, P, budget=3200)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("pumpkin-1x1", pumpkin, (0.8, 0.8)),
    ("witch-hat-1x1", witch_hat, (0.8, 0.8)),
    ("cauldron-1x1", cauldron, (0.8, 0.8)),
    ("ghost-2x2", ghost, (1.8, 1.8)),
    ("ghost-1x1", lambda: ghost(arms_forward=True), (0.8, 0.8)),
    ("graveyard-2x1", graveyard, (2.0, 1.0)),
    ("haunted-manor-2x2", manor, (2.0, 2.0)),
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
