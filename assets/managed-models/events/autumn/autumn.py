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
    ("orange", "#f28a1c"), ("orange_dark", "#dd6f10"), ("red_orange", "#e8531f"), ("red_orange_dark", "#c8401a"),
    ("cream", "#f1e3c0"), ("cream_shade", "#dcc99a"), ("stem", "#5f9a2a"),
    ("leaf_red", "#cc3a1c"), ("leaf_orange", "#ee8a1e"), ("leaf_yellow", "#f4b830"), ("leaf_brown", "#9a5a22"),
    ("straw", "#e8bd4a"), ("straw_dark", "#c9962c"), ("straw_light", "#f4d57a"),
    ("wood", "#7a4a28"), ("wood_dark", "#5a3820"), ("trunk", "#6e4630"), ("trunk_dark", "#523222"),
    ("stone", "#8d8fa0"), ("stone_dark", "#6c6e80"),
    ("blue", "#4a78c2"), ("blue_dark", "#34589a"), ("red", "#c8352c"), ("red_dark", "#9a241e"),
    ("brown", "#8a5a34"), ("brown_dark", "#6a4126"),
    ("shirt_red", "#c8402e"), ("shirt_yellow", "#e8b83a"), ("shirt_green", "#6f9a3e"),
    ("patch", "#d8b070"), ("gold", "#f4c430", 0.5, 0.4), ("face", "#2a1c14"), ("mound", "#b3622a"),
])
C = {n: P[n] for n, *_ in P.entries}

LEAF = [(0, 0.09), (0.045, 0.03), (0.07, -0.01), (0.02, -0.025), (0, -0.05), (-0.02, -0.025), (-0.07, -0.01), (-0.045, 0.03)]
LEAF_COLORS = ["leaf_red", "leaf_orange", "leaf_yellow", "leaf_brown"]


def sector(c, n_sectors):
    return int((math.atan2(c.y, c.x) % (2 * math.pi)) / (2 * math.pi / n_sectors))


def fillet(ob, width, color, segments=1, min_angle=0.35):
    """Round the sharp edges of a single-coloured part."""
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


def leaf(tag, at, color, size=1.0, yaw=0, pitch=0, roll=0):
    ob = lpm.sweep(tag, [(x * size, y * size) for x, y in LEAF], 0.008, color=color, axis="z")
    lpm.rotate(ob, roll, "X")
    lpm.rotate(ob, pitch, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def spike(tag, at, color, length=0.12, radius=0.03, pitch=0, yaw=0):
    """Straw spike lying along +Z, tilted by `pitch` around Y then turned by `yaw` around Z, rooted at `at`."""
    ob = lpm.prism(tag, 3, radius, length, color=color, radius_top=0.004)
    lpm.rotate(ob, pitch, "Y")
    lpm.rotate(ob, yaw, "Z")
    return lpm.move(ob, *at)


def limb(tag, base, azimuth, tilt, length, r0, r1, color):
    """Tapered branch leaving `base` along a direction `tilt` degrees from vertical, turned `azimuth` degrees around Z. Returns (part, tip)."""
    ob = lpm.prism(tag, 5, r0, length, color=color, radius_top=r1)
    lpm.rotate(ob, tilt, "Y")
    lpm.rotate(ob, azimuth, "Z")
    lpm.move(ob, *base)
    t, a = math.radians(tilt), math.radians(azimuth)
    tip = (base[0] + length * math.sin(t) * math.cos(a), base[1] + length * math.sin(t) * math.sin(a), base[2] + length * math.cos(t))
    return ob, tip


# ------------------------------------------------------------------ pumpkin trio
PUMPKIN_PROFILE = [(0.0, 0.01), (0.22, 0.0), (0.38, 0.08), (0.46, 0.22), (0.46, 0.32), (0.38, 0.44), (0.18, 0.50), (0.08, 0.47), (0.0, 0.43)]


def ribbed_pumpkin(tag, radius, height, at, body, shade):
    ratio_r, ratio_h = radius / 0.46, height / 0.5
    body_part = lpm.lathe(f"body_{tag}", [(r * ratio_r, z * ratio_h) for r, z in PUMPKIN_PROFILE], segments=12, at=at, color=body)
    for v in body_part.data.vertices:
        if abs(v.co.x - at[0]) + abs(v.co.y - at[1]) < 1e-6:
            continue
        k = round((math.atan2(v.co.y - at[1], v.co.x - at[0]) % (2 * math.pi)) / (2 * math.pi / 12)) % 12
        factor = 1.0 + (0.05 if k % 2 == 0 else -0.05)
        v.co.x = at[0] + (v.co.x - at[0]) * factor
        v.co.y = at[1] + (v.co.y - at[1]) * factor
    body_part.data.update()
    centre = Vector((at[0], at[1], 0))
    lpm.paint(body_part, shade, lambda c, n, i: sector(c - centre, 12) % 2 == 1)
    stem = lpm.prism(f"stem_{tag}", 5, 0.075 * ratio_r, 0.18 * ratio_h, at=(at[0], at[1], at[2] + 0.40 * ratio_h), color=C["stem"], radius_top=0.045 * ratio_r)
    for v in stem.data.vertices:
        v.co.x += 0.5 * max(v.co.z - at[2] - 0.40 * ratio_h, 0)
    stem.data.update()
    return [body_part, stem]


def pumpkin_trio():
    parts = []
    parts += ribbed_pumpkin("big", 0.34, 0.34, (-0.2, 0.1, 0), C["orange"], C["orange_dark"])
    parts += ribbed_pumpkin("mid", 0.26, 0.26, (0.3, -0.02, 0), C["red_orange"], C["red_orange_dark"])
    parts += ribbed_pumpkin("small", 0.2, 0.19, (0.0, -0.36, 0), C["cream"], C["cream_shade"])
    return lpm.finish("SM_AU_PumpkinTrio", parts, P, budget=900)


# ------------------------------------------------------------------ leaf pile
def leaf_pile():
    rng = random.Random(11)
    profile = [(0.5, 0.05), (0.4, 0.2), (0.22, 0.32), (0.0, 0.38)]

    def height_at(r):
        for (r1, z1), (r0, z0) in zip(profile, profile[1:]):
            if r0 <= r <= r1:
                return z0 + (z1 - z0) * (r - r0) / (r1 - r0)
        return profile[0][1]

    mound = lpm.lathe("mound", [(0.5, 0.0)] + profile, segments=9, color=C["mound"])
    for v in mound.data.vertices:
        if abs(v.co.x) + abs(v.co.y) < 1e-6:
            continue
        f = rng.uniform(0.9, 1.1)
        v.co.x *= f
        v.co.y *= f
    mound.data.update()
    picks = [rng.choice(LEAF_COLORS) for _ in mound.data.polygons]
    for name in LEAF_COLORS:
        lpm.paint(mound, C[name], lambda c, n, i, name=name: picks[i] == name)
    parts = [mound]
    for i in range(34):
        r = 0.46 * math.sqrt(rng.random())
        a = rng.uniform(0, 360)
        slope = math.degrees(math.atan2(height_at(max(r - 0.05, 0)) - height_at(r + 0.05), 0.1))
        z = height_at(r) + 0.006
        parts.append(leaf(f"l{i}", (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)), z), C[rng.choice(LEAF_COLORS)],
                          size=rng.uniform(1.5, 2.0), yaw=a + rng.uniform(-40, 40), pitch=slope + rng.uniform(-8, 8), roll=rng.uniform(-8, 8)))
    for i in range(7):
        a = i * 360 / 7 + rng.uniform(-20, 20)
        r = rng.uniform(0.52, 0.66)
        parts.append(leaf(f"g{i}", (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)), 0), C[rng.choice(LEAF_COLORS)],
                          size=rng.uniform(1.4, 1.8), yaw=rng.uniform(0, 360)))
    return lpm.finish("SM_AU_LeafPile", parts, P, budget=1400)


# ------------------------------------------------------------------ hay bales
def bale(tag, at, turned):
    size = (0.5, 0.4, 0.34)
    body = fillet(lpm.box(f"bale_{tag}", size, color=C["straw"]), 0.03, C["straw"])
    lpm.paint(body, C["straw_light"], lambda c, n, i: n.z > 0.5)
    parts = [body]
    for k, x in enumerate((-0.13, 0.13)):
        parts.append(lpm.box(f"strap_{tag}{k}", (0.04, size[1] + 0.03, size[2] + 0.015), at=(x, 0, 0), color=C["wood"]))
    rng = random.Random(hash(tag) % 1000)
    for k in range(5):
        side = -1 if k % 2 else 1
        parts.append(spike(f"tuft_{tag}{k}", (side * 0.24, rng.uniform(-0.15, 0.15), rng.uniform(0.08, 0.26)), C["straw_dark"] if k % 2 else C["straw_light"],
                           length=0.12, radius=0.025, pitch=side * rng.uniform(65, 85), yaw=rng.uniform(-20, 20)))
    for p in parts:
        lpm.rotate(p, 90 if turned else 0, "Z")
        lpm.move(p, *at)
    return parts


def hay_bales():
    parts = bale("a", (-0.26, 0, 0), False) + bale("b", (0.26, 0, 0), False) + bale("c", (0, 0, 0.33), True)
    return lpm.finish("SM_AU_HayBales", parts, P, budget=1400)


# ------------------------------------------------------------------ scarecrow
def scarecrow(overalls, overalls_dark, shirt, band):
    rng = random.Random(5)
    parts = [lpm.prism("post", 4, 0.04, 1.3, color=C["wood"], rotate=45), lpm.box("crossbar", (1.0, 0.05, 0.05), at=(0, 0, 0.95), color=C["wood_dark"])]
    for s in (-1, 1):
        parts.append(fillet(lpm.box("leg", (0.12, 0.13, 0.36), at=(s * 0.075, 0, 0.3), color=overalls), 0.012, overalls))
        for k in range(3):
            parts.append(spike(f"cuff{s}{k}", (s * 0.075 + (k - 1) * 0.04, rng.uniform(-0.03, 0.03), 0.34), C["straw"], length=0.12, radius=0.028, pitch=180 + rng.uniform(-12, 12), yaw=rng.uniform(0, 360)))
        parts.append(fillet(lpm.box("sleeve", (0.3, 0.09, 0.09), at=(s * 0.3, 0, 0.93), color=shirt), 0.012, shirt))
        for k in range(4):
            parts.append(spike(f"hand{s}{k}", (s * 0.44, rng.uniform(-0.03, 0.03), 0.975), C["straw"], length=0.14, radius=0.03,
                               pitch=s * (90 + (k - 1.5) * 14), yaw=0))
        parts.append(lpm.box("strap_front", (0.035, 0.02, 0.13), at=(s * 0.07, -0.092, 0.91), color=overalls_dark))
        parts.append(lpm.box("strap_top", (0.035, 0.19, 0.03), at=(s * 0.07, 0, 1.03), color=overalls_dark))
        parts.append(lpm.box("button", (0.03, 0.02, 0.03), at=(s * 0.07, -0.103, 0.9), color=C["gold"]))
    parts.append(fillet(lpm.box("hips", (0.3, 0.17, 0.2), at=(0, 0, 0.56), color=overalls), 0.012, overalls))
    parts.append(fillet(lpm.box("torso", (0.3, 0.17, 0.32), at=(0, 0, 0.72), color=shirt), 0.012, shirt))
    parts.append(lpm.box("bib", (0.2, 0.02, 0.2), at=(0, -0.092, 0.72), color=overalls))
    parts.append(lpm.box("pocket", (0.08, 0.02, 0.06), at=(0, -0.102, 0.78), color=overalls_dark))
    parts.append(lpm.box("patch", (0.07, 0.02, 0.07), at=(-0.075, -0.072, 0.42), color=C["patch"]))
    head = fillet(lpm.box("head", (0.24, 0.22, 0.24), at=(0, 0, 1.06), color=C["straw"]), 0.03, C["straw"])
    parts.append(head)
    for s in (-1, 1):
        parts.append(lpm.sweep("eye", [(s * 0.085, 0), (s * 0.03, 0), (s * 0.06, 0.05)], 0.02, at=(0, -0.11, 1.19), color=C["face"]))
        for k in range(3):
            parts.append(spike(f"hair{s}{k}", (s * 0.12, rng.uniform(-0.05, 0.05), 1.1 + k * 0.045), C["straw_dark"], length=0.11, radius=0.025, pitch=s * (95 + k * 12), yaw=0))
    parts.append(lpm.sweep("mouth", [(-0.075, 0.045), (-0.04, 0.03), (0, 0.045), (0.04, 0.03), (0.075, 0.045), (0.05, 0.0), (0.0, 0.015), (-0.05, 0.0)], 0.02,
                           at=(0, -0.11, 1.09), color=C["face"]))
    brim = lpm.lathe("brim", [(0.12, 0.0), (0.27, 0.0), (0.27, 0.02), (0.12, 0.04)], segments=8, at=(0, 0, 1.27), color=C["wood"])
    crown = lpm.lathe("crown", [(0.14, 0.03), (0.12, 0.13), (0.08, 0.2), (0.0, 0.24)], segments=8, at=(0, 0, 1.27), color=C["wood"])
    hat_band = lpm.prism("hat_band", 8, 0.147, 0.05, at=(0, 0, 1.31), color=band, radius_top=0.135)
    hat_leaf = lpm.sweep("hat_leaf", [(x * 0.8, z * 0.8) for x, z in LEAF], 0.012, at=(0.09, -0.12, 1.35), color=C["leaf_orange"])
    lpm.rotate(crown, -10, "Y", about=(0, 0, 1.29))
    lpm.rotate(hat_band, -10, "Y", about=(0, 0, 1.29))
    lpm.rotate(hat_leaf, -10, "Y", about=(0, 0, 1.29))
    parts += [brim, crown, hat_band, hat_leaf]
    return parts


SCARECROWS = {
    "scarecrow-blue-1x1": ("SM_AU_ScarecrowBlue", "blue", "blue_dark", "shirt_red", "orange"),
    "scarecrow-red-1x1": ("SM_AU_ScarecrowRed", "red", "red_dark", "shirt_yellow", "stem"),
    "scarecrow-brown-1x1": ("SM_AU_ScarecrowBrown", "brown", "brown_dark", "shirt_green", "red_orange"),
}


def scarecrow_variant(model_id):
    name, overalls, dark, shirt, band = SCARECROWS[model_id]
    return lpm.finish(name, scarecrow(C[overalls], C[dark], C[shirt], C[band]), P, budget=1800)


# ------------------------------------------------------------------ autumn tree
def autumn_tree():
    rng = random.Random(7)
    trunk = lpm.lathe("trunk", [(0.26, 0.0), (0.16, 0.14), (0.12, 0.5), (0.1, 0.85)], segments=7, color=C["trunk"])
    lpm.paint(trunk, C["trunk_dark"], lambda c, n, i: sector(c, 7) % 2 == 1)
    parts = [trunk]
    leaves = []

    def cluster(tag, tip, count):
        for k in range(count):
            offset = [rng.uniform(-0.1, 0.1) for _ in range(3)]
            leaves.append(leaf(f"{tag}{k}", (tip[0] + offset[0], tip[1] + offset[1], tip[2] + offset[2]), C[rng.choice(LEAF_COLORS)],
                               size=rng.uniform(1.7, 2.3), yaw=rng.uniform(0, 360), pitch=rng.uniform(0, 60), roll=rng.uniform(-40, 40)))

    leader, tip = limb("leader", (0, 0, 0.85), 0, 8, 0.7, 0.08, 0.03, C["trunk"])
    parts.append(leader)
    cluster("lt", tip, 3)
    for k, (azimuth, tilt) in enumerate(((0, 52), (72, 56), (144, 50), (216, 58), (288, 54))):
        azimuth += rng.uniform(-10, 10)
        a = math.radians(azimuth)
        branch, tip = limb(f"br{k}", (0.05 * math.cos(a), 0.05 * math.sin(a), 0.85), azimuth, tilt, 1.0, 0.07, 0.03, C["trunk"])
        parts.append(branch)
        cluster(f"bt{k}", tip, 3)
        mid = (0.05 * math.cos(a) + 0.55 * (tip[0] - 0.05 * math.cos(a)), 0.05 * math.sin(a) + 0.55 * (tip[1] - 0.05 * math.sin(a)), 0.85 + 0.55 * (tip[2] - 0.85))
        twig, twig_tip = limb(f"tw{k}", mid, azimuth + rng.choice((-1, 1)) * 38, tilt + rng.uniform(-10, 25), 0.5, 0.035, 0.015, C["trunk_dark"])
        parts.append(twig)
        cluster(f"tt{k}", twig_tip, 3)
        cluster(f"tm{k}", mid, 1)
    parts += leaves
    for i in range(14):
        a = rng.uniform(0, 360)
        r = rng.uniform(0.3, 1.0)
        parts.append(leaf(f"f{i}", (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)), 0), C[rng.choice(LEAF_COLORS)],
                          size=rng.uniform(1.1, 1.5), yaw=rng.uniform(0, 360)))
    for i, (a, r) in enumerate(((20, 0.5), (110, 0.55), (200, 0.45), (300, 0.6))):
        parts.append(lpm.prism(f"stone{i}", 5, rng.uniform(0.07, 0.1), 0.06, at=(r * math.cos(math.radians(a)), r * math.sin(math.radians(a)), 0),
                               color=C["stone"] if i % 2 else C["stone_dark"], radius_top=0.05, rotate=rng.uniform(0, 70)))
    return lpm.finish("SM_AU_Tree", parts, P, budget=3000)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("pumpkin-trio-1x1", pumpkin_trio, (0.9, 0.9)),
    ("leaf-pile-1x1", leaf_pile, (0.9, 0.9)),
    ("hay-bales-1x1", hay_bales, (0.9, 0.9)),
    ("scarecrow-blue-1x1", lambda: scarecrow_variant("scarecrow-blue-1x1"), (0.9, 0.9)),
    ("scarecrow-red-1x1", lambda: scarecrow_variant("scarecrow-red-1x1"), (0.9, 0.9)),
    ("scarecrow-brown-1x1", lambda: scarecrow_variant("scarecrow-brown-1x1"), (0.9, 0.9)),
    ("autumn-tree-2x2", autumn_tree, (1.8, 1.8)),
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
