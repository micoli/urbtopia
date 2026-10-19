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
    ("white", "#fbfbff"), ("white_shade", "#dfe5f0"), ("pink", "#ff8fb8"), ("pink_dark", "#e0508a"), ("pink_light", "#ffc9de"),
    ("blue", "#7fc8f0"), ("blue_dark", "#4a9fd8"), ("blue_light", "#c4e8fa"), ("purple", "#b48ae0"), ("purple_dark", "#8a5ac0"),
    ("yellow", "#ffd84a"), ("yellow_dark", "#f2a91e"), ("mint", "#8fe0b8"), ("mint_dark", "#52c08a"),
    ("choco", "#6b3a24"), ("choco_light", "#8a5236"), ("cream", "#f1e0c0"),
    ("foil_gold", "#f4c430", 0.5, 0.35), ("foil_pink", "#e0359a", 0.5, 0.35), ("foil_purple", "#8a3ac0", 0.5, 0.35),
    ("grass", "#4fb83d"), ("grass_dark", "#2f8f34"), ("grass_light", "#7fd150"), ("black", "#26262e"),
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


def sphere(name, r, centre, color, segments=8, rings=6):
    profile = [(0, 0)] + [(r * math.cos(math.radians(a)), r + r * math.sin(math.radians(a))) for a in range(-90 + 180 // rings, 90, 180 // rings)] + [(0, 2 * r)]
    return lpm.lathe(name, profile, segments=segments, at=(centre[0], centre[1], centre[2] - r), color=color)


def blob(name, radii, centre, color, segments=8, rings=6):
    rx, ry, rz = radii
    part = sphere(name, 1.0, (0, 0, 0), color, segments, rings)
    lpm.scale(part, rx, ry, rz)
    return lpm.move(part, *centre)


def sector(c, n_sectors):
    return int((math.atan2(c.y, c.x) % (2 * math.pi)) / (2 * math.pi / n_sectors))


def leaf(name, length, width, color, lean, yaw):
    outline = [(0, 0), (width, length * 0.3), (width * 0.5, length * 0.75), (0, length), (-width * 0.5, length * 0.75), (-width, length * 0.3)]
    part = lpm.sweep(name, outline, 0.008, color=color)
    lpm.rotate(part, lean, "Y")
    lpm.rotate(part, yaw, "Z")
    return part


def tuft(tag, at, blades=4, height=0.14, seed=0):
    rng = random.Random(seed)
    return [lpm.move(leaf(f"{tag}{k}", height * rng.uniform(0.75, 1.1), 0.022, C["grass_light"] if k % 2 else C["grass"], rng.uniform(14, 34), 360 * k / blades + rng.uniform(-20, 20)), *at)
            for k in range(blades)]


def grass_base(name, radius, height=0.04):
    return fillet(lpm.prism(name, 10, radius, height, color=C["grass"], radius_top=radius * 0.92, rotate=18), 0.008)


# ------------------------------------------------------------------ eggs
SEGMENTS, RINGS = 10, 8


def egg_profile(height, radius, rings=RINGS):
    points = [(0, 0)]
    for k in range(1, rings):
        theta = math.radians(-90 + 180 * k / rings)
        points.append((radius * math.cos(theta) * (1 - 0.12 * math.sin(theta)), height * (math.sin(theta) + 1) / 2))
    points.append((0, height))
    return points


def egg(name, height, radius, at, style, colors, rings=RINGS, segments=SEGMENTS):
    """Egg standing on `at`; `style` picks a face pattern from `colors` (base, accent, accent2)."""
    base, accent, accent2 = (C[n] for n in colors)
    part = lpm.lathe(name, egg_profile(height, radius, rings), segments=segments, at=at, color=base)

    def pick(c, n, i):
        return style(int((c.z - at[2]) / height * rings), sector(c, segments))

    for poly in part.data.polygons:
        ring_index = int((poly.center.z - at[2]) / height * rings)
        col = sector(poly.center, segments)
        which = style(ring_index, col)
        if which == 1:
            lpm.paint(part, accent, lambda c, n, i, target=poly.index: i == target)
        elif which == 2:
            lpm.paint(part, accent2, lambda c, n, i, target=poly.index: i == target)
    return part


def bands(ring, col):
    if ring in (3, 4):
        return 1
    return 2 if ring == 6 else 0


def zigzag(ring, col):
    if ring == 3:
        return 1 if col % 2 == 0 else 2
    return 1 if ring == 2 and col % 2 == 1 else 0


def dots(ring, col):
    return 1 if ring in (2, 4, 6) and col % 3 == (ring // 2) % 3 else 0


def flowers(ring, col):
    if col % 5 != 0 or ring not in (2, 3, 4):
        return 0
    return 2 if ring == 3 else 1


def striped(ring, col):
    return 1 if (ring + col) % 4 == 0 else 0


def foil(ring, col):
    return 1 if (col + ring) % 2 == 0 else 0


def eggs_small():
    parts = []
    parts.append(egg("egg_a", 0.56, 0.2, (-0.1, -0.02, 0.0), bands, ("blue", "white", "mint")))
    parts.append(egg("egg_b", 0.46, 0.17, (0.2, 0.14, 0.0), zigzag, ("pink", "white", "yellow")))
    parts.append(egg("egg_c", 0.38, 0.15, (0.14, -0.24, 0.0), dots, ("purple", "white", "purple_light" if False else "pink_light")))
    for k, (x, y) in enumerate(((-0.3, 0.2), (0.0, 0.3), (-0.28, -0.22), (0.34, -0.02))):
        parts += tuft(f"tuft{k}", (x, y, 0.0), height=0.13, seed=k)
    return lpm.finish("SM_EA_Eggs", parts, P, budget=1800)


def eggs_wide():
    parts = []
    layout = [
        (-0.75, 0.04, 0.5, 0.18, bands, ("blue", "white", "mint")),
        (-0.45, -0.18, 0.4, 0.15, zigzag, ("pink", "white", "yellow")),
        (-0.15, 0.1, 0.56, 0.2, flowers, ("purple", "white", "yellow")),
        (0.2, -0.12, 0.42, 0.16, dots, ("yellow", "white", "yellow_dark")),
        (0.5, 0.12, 0.5, 0.18, bands, ("mint", "white", "pink")),
        (0.78, -0.08, 0.38, 0.15, zigzag, ("blue", "white", "pink")),
    ]
    for k, (x, y, h, r, style, colors) in enumerate(layout):
        parts.append(egg(f"egg{k}", h, r, (x, y, 0.0), style, colors))
    for k, (x, y) in enumerate(((-0.9, -0.28), (-0.3, 0.3), (0.0, -0.3), (0.35, 0.28), (0.9, 0.25), (0.62, -0.32), (-0.62, 0.3))):
        parts += tuft(f"tuft{k}", (x, y, 0.0), height=0.14, seed=k)
    return lpm.finish("SM_EA_EggsWide", parts, P, budget=2600)


# ------------------------------------------------------------------ bow
def bow(tag, at, color, size=1.0, tails=False):
    wing = [(0, 0), (0.05, 0.07), (0.115, 0.06), (0.12, 0.0), (0.05, -0.005)]
    parts = [lpm.sweep(f"bow{tag}{k}", wing, 0.03, color=color) for k in range(2)]
    lpm.rotate(parts[1], 180, "Z")
    parts.append(lpm.box(f"knot{tag}", (0.05, 0.05, 0.05), at=(0, 0, -0.01), color=color))
    if tails:
        for s in (-1, 1):
            tail = lpm.box(f"tail{tag}{s}", (0.06, 0.02, 0.22), at=(s * 0.03, 0, -0.23), color=color, taper=(1.3, 1.0))
            parts.append(lpm.rotate(tail, s * 14, "Y", about=(s * 0.03, 0, -0.01)))
    for p in parts:
        lpm.scale(p, size, size, size)
        lpm.move(p, *at)
    return parts


# ------------------------------------------------------------------ giant chocolate egg
def giant_egg():
    h, r = 1.25, 0.5
    rings = 12
    body = lpm.lathe("choco", egg_profile(h, r, rings), segments=12, at=(0, 0, 0), color=C["choco"])
    for poly in body.data.polygons:
        if (int(poly.center.z / h * rings) + sector(poly.center, 12)) % 5 == 0:
            lpm.paint(body, C["choco_light"], lambda c, n, i, target=poly.index: i == target)
    parts = [body]
    band_profile = [(pr * 1.035, pz) for pr, pz in egg_profile(h, r, rings)[6:8]]
    parts.append(lpm.lathe("ribbon", band_profile, segments=12, color=C["pink"]))
    parts += bow("giant", (0, -band_profile[1][0] - 0.01, band_profile[0][1] + 0.1), C["pink"], 1.8, tails=True)
    parts.append(egg("small", 0.6, 0.24, (0.62, -0.06, 0.0), striped, ("choco_light", "cream", "cream"), rings=8, segments=10))
    for k, (x, y, colour) in enumerate(((0.55, -0.52, "foil_pink"), (0.84, -0.34, "foil_gold"), (0.3, -0.62, "foil_purple"))):
        small = egg(f"foil{k}", 0.22, 0.09, (x, y, 0.0), foil, (colour, "white", "white"))
        lpm.paint(small, C[colour], lambda c, n, i: True)
        parts.append(small)
    return lpm.finish("SM_EA_GiantEgg", parts, P, budget=2600)


# ------------------------------------------------------------------ rabbit
def rabbit():
    parts = []
    z = 0.0
    parts.append(blob("body", (0.25, 0.22, 0.27), (0, 0.04, z + 0.25), C["white"], segments=8, rings=6))
    for s in (-1, 1):
        parts.append(blob(f"haunch{s}", (0.1, 0.17, 0.13), (s * 0.17, 0.05, z + 0.13), C["white"]))
        parts.append(fillet(lpm.box(f"hind{s}", (0.09, 0.2, 0.05), at=(s * 0.17, -0.09, z), color=C["white"]), 0.008))
        parts.append(fillet(lpm.box(f"paw{s}", (0.09, 0.13, 0.05), at=(s * 0.07, -0.19, z), color=C["white"]), 0.008))
        parts.append(fillet(lpm.box(f"foreleg{s}", (0.08, 0.08, 0.22), at=(s * 0.07, -0.16, z + 0.03), color=C["white"]), 0.006))
        ear = lpm.box(f"ear{s}", (0.13, 0.05, 0.36), at=(s * 0.085, -0.03, z + 0.62), color=C["white"], taper=(0.75, 1.0))
        inner = lpm.box(f"ear_in{s}", (0.075, 0.012, 0.27), at=(s * 0.085, -0.058, z + 0.66), color=C["pink"], taper=(0.7, 1.0))
        for p in (ear, inner):
            lpm.rotate(p, s * 7, "Y", about=(s * 0.085, 0, z + 0.62))
            parts.append(p if p is not ear else fillet(ear, 0.008))
        parts.append(lpm.box(f"eye{s}", (0.04, 0.012, 0.025), at=(s * 0.075, -0.235, z + 0.57), color=C["black"]))
        parts.append(lpm.box(f"cheek{s}", (0.05, 0.012, 0.03), at=(s * 0.12, -0.228, z + 0.5), color=C["pink_light"]))
    parts.append(blob("head", (0.18, 0.17, 0.16), (0, -0.07, z + 0.58), C["white"], segments=8, rings=6))
    parts.append(blob("muzzle", (0.08, 0.05, 0.06), (0, -0.22, z + 0.52), C["white"], segments=6, rings=4))
    parts.append(lpm.box("nose", (0.04, 0.02, 0.03), at=(0, -0.265, z + 0.53), color=C["pink_dark"]))
    parts.append(lpm.box("mouth", (0.05, 0.012, 0.03), at=(0, -0.255, z + 0.47), color=C["pink_dark"]))
    parts.append(blob("tail", (0.08, 0.08, 0.08), (0, 0.27, z + 0.14), C["white_shade"], segments=6, rings=4))
    return lpm.finish("SM_EA_Rabbit", parts, P, budget=2600)


# ------------------------------------------------------------------ candy pile
def candy(tag, colors, style, at, yaw, tilt=0):
    body_color, accent, wrapper = (C[n] for n in colors)
    body = lpm.lathe(f"body{tag}", [(0, -0.16), (0.1, -0.15), (0.14, -0.09), (0.14, 0.09), (0.1, 0.15), (0, 0.16)], segments=8, color=body_color)
    for poly in body.data.polygons:
        if style(int((poly.center.z + 0.16) / 0.32 * 6), sector(poly.center, 8)):
            lpm.paint(body, accent, lambda c, n, i, target=poly.index: i == target)
    parts = [body]
    parts.append(lpm.prism(f"twist_a{tag}", 4, 0.04, 0.14, at=(0, 0, 0.13), color=wrapper, radius_top=0.12, rotate=45))
    parts.append(lpm.prism(f"twist_b{tag}", 4, 0.12, 0.14, at=(0, 0, -0.27), color=wrapper, radius_top=0.04, rotate=45))
    for p in parts:
        lpm.rotate(p, 90, "Y")
        lpm.rotate(p, tilt, "X")
        lpm.rotate(p, yaw, "Z")
        lpm.move(p, *at)
    return parts


def dotted(ring, col):
    return ring in (1, 3) and col % 2 == ring // 2


def striped_rings(ring, col):
    return ring % 2 == 1


def zigzag_band(ring, col):
    return ring in (2, 3) and (col + ring) % 2 == 0


def candy_pile():
    parts = []
    spec = [
        (("pink", "white", "pink_dark"), dotted), (("blue", "white", "blue_dark"), striped_rings), (("yellow", "yellow_dark", "yellow_dark"), zigzag_band),
    ]
    layout = [(0.0, -0.17, 0.14, 4, 0), (0.02, 0.17, 0.14, -6, 0), (0.0, 0.0, 0.32, -3, 0)]
    for k, (x, y, z, yaw, tilt) in enumerate(layout):
        colors, style = spec[k % 3]
        parts += candy(str(k), colors, style, (x, y, z), yaw, tilt)
    return lpm.finish("SM_EA_CandyPile", parts, P, budget=2400)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("rabbit-1x1", rabbit, (0.9, 0.9)),
    ("eggs-1x1", eggs_small, (0.9, 0.9)),
    ("eggs-2x1", eggs_wide, (1.9, 0.9)),
    ("giant-chocolate-egg-2x2", giant_egg, (1.8, 1.8)),
    ("candy-pile-1x1", candy_pile, (0.9, 0.9)),
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
