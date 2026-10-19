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
    ("red", "#d83a3a"), ("red_dark", "#a82424"), ("green", "#2f9a45"), ("green_dark", "#1f6e32"), ("pine", "#2f7a3a"), ("pine_dark", "#226030"),
    ("gold", "#f4c430", 0.4, 0.4), ("gold_dark", "#c4921a", 0.4, 0.4), ("white", "#ffffff"), ("snow", "#f4f8ff"), ("snow_shade", "#d6e4f5"),
    ("icing", "#fff6e6"), ("ginger", "#b0693a"), ("ginger_dark", "#7e4524"), ("ginger_light", "#cd8a4c"),
    ("black", "#26262e"), ("skin", "#f2c9a0"), ("beard", "#eceaf0"), ("blue", "#3f6fd0"), ("blue_dark", "#2a4a9a"),
    ("trunk", "#6e4630"), ("light", "#ffe27a"), ("cream", "#f3e3c3"), ("window", "#ffc85a"),
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


def star_outline(outer, inner):
    return [((outer if i % 2 == 0 else inner) * math.cos(math.radians(90 + 36 * i)), (outer if i % 2 == 0 else inner) * math.sin(math.radians(90 + 36 * i))) for i in range(10)]


def sector(c, n_sectors):
    return int((math.atan2(c.y, c.x) % (2 * math.pi)) / (2 * math.pi / n_sectors))


def bow(tag, at, color, size=1.0, facing="up"):
    wing = [(0, 0), (0.05, 0.07), (0.115, 0.06), (0.12, 0.0), (0.05, -0.005)]
    parts = [lpm.sweep(f"bow{tag}{k}", wing, 0.03, color=color) for k in range(2)]
    lpm.rotate(parts[1], 180, "Z")
    parts.append(lpm.box(f"knot{tag}", (0.045, 0.045, 0.05), at=(0, 0, -0.004), color=color))
    for p in parts:
        if facing == "front":
            lpm.move(p, 0, 0, -0.03)
        lpm.scale(p, size, size, size)
        lpm.move(p, *at)
    return parts


# ------------------------------------------------------------------ nutcracker
def nutcracker():
    parts = [fillet(lpm.prism("base", 8, 0.36, 0.04, color=C["gold"], rotate=22.5), 0.006),
             fillet(lpm.prism("base2", 8, 0.3, 0.03, at=(0, 0, 0.04), color=C["gold_dark"], rotate=22.5), 0.006)]
    z = 0.07
    for s in (-1, 1):
        parts.append(fillet(lpm.box(f"boot{s}", (0.11, 0.16, 0.2), at=(s * 0.07, -0.01, z), color=C["black"]), 0.01))
        parts.append(fillet(lpm.box(f"leg{s}", (0.1, 0.1, 0.25), at=(s * 0.07, 0, z + 0.2), color=C["cream"]), 0.008))
        parts.append(fillet(lpm.box(f"arm{s}", (0.075, 0.075, 0.3), at=(s * 0.2, 0, 0.63), color=C["red"]), 0.01))
        parts.append(lpm.box(f"cuff{s}", (0.085, 0.085, 0.03), at=(s * 0.2, 0, 0.66), color=C["gold"]))
        parts.append(sphere(f"hand{s}", 0.04, (s * 0.2, 0, 0.615), C["white"], segments=8, rings=4))
        parts.append(lpm.box(f"epaulette{s}", (0.11, 0.11, 0.025), at=(s * 0.19, 0, 0.935), color=C["gold"]))
        for k in range(3):
            parts.append(lpm.box(f"fringe{s}{k}", (0.012, 0.012, 0.045), at=(s * 0.19 + (k - 1) * 0.04, 0, 0.89), color=C["gold"]))
        parts.append(sphere(f"sideburn{s}", 0.028, (s * 0.1, 0.0, 1.0), C["beard"], segments=6, rings=4))
        parts.append(lpm.box(f"eye{s}", (0.022, 0.01, 0.028), at=(s * 0.045, -0.092, 1.08), color=C["black"]))
    parts.append(fillet(lpm.box("skirt", (0.29, 0.17, 0.14), at=(0, 0, 0.45), color=C["red"], taper=(0.95, 0.95)), 0.01))
    parts.append(fillet(lpm.box("torso", (0.3, 0.17, 0.3), at=(0, 0, 0.6), color=C["red"], taper=(0.92, 1.0)), 0.01))
    parts.append(lpm.box("belt", (0.31, 0.18, 0.04), at=(0, 0, 0.56), color=C["black"]))
    parts.append(lpm.box("buckle", (0.06, 0.01, 0.05), at=(0, -0.09, 0.555), color=C["gold"]))
    for k in range(3):
        parts.append(lpm.box(f"button{k}", (0.025, 0.01, 0.025), at=(0, -0.088, 0.65 + 0.075 * k), color=C["gold"]))
    parts.append(lpm.box("neck", (0.07, 0.07, 0.05), at=(0, 0, 0.9), color=C["skin"]))
    parts.append(sphere("head", 0.11, (0, 0, 1.03), C["skin"], segments=10, rings=6))
    beard = sphere("beard", 0.06, (0, -0.06, 0.95), C["beard"], segments=8, rings=4)
    parts.append(lpm.scale(beard, 1.1, 0.8, 1.0, about=(0, -0.06, 0.95)))
    parts.append(lpm.box("mustache", (0.14, 0.03, 0.026), at=(0, -0.105, 1.0), color=C["black"]))
    parts.append(sphere("nose", 0.022, (0, -0.105, 1.045), C["skin"], segments=6, rings=4))
    parts.append(fillet(lpm.prism("hat", 8, 0.105, 0.22, at=(0, 0, 1.1), color=C["black"], radius_top=0.09, rotate=22.5), 0.006))
    parts.append(lpm.prism("hatband", 8, 0.108, 0.03, at=(0, 0, 1.1), color=C["gold"], rotate=22.5))
    parts.append(lpm.sweep("diamond", [(0, -0.04), (0.032, 0), (0, 0.04), (-0.032, 0)], 0.012, at=(0, -0.1, 1.21), color=C["gold"]))
    return lpm.finish("SM_WH_Nutcracker", parts, P, budget=2400)


# ------------------------------------------------------------------ gingerbread house
def gingerbread_house():
    parts = []
    base = 0.0
    parts.append(fillet(lpm.box("body", (1.1, 0.8, 0.42), at=(0, 0, base), color=C["ginger"]), 0.01))
    parts.append(lpm.box("trim", (1.16, 0.86, 0.03), at=(0, 0, base + 0.39), color=C["icing"]))
    roof_z = base + 0.42
    attic = lpm.sweep("attic", [(-0.4, 0), (0.4, 0), (0, 0.3)], 1.1, at=(0, 0, roof_z), color=C["ginger"])
    parts.append(lpm.rotate(attic, 90, "Z"))
    chevron = [(-0.52, 0), (0, 0.34), (0.52, 0), (0.52, -0.05), (0, 0.29), (-0.52, -0.05)]
    roof = fillet(lpm.sweep("roof", chevron, 1.2, at=(0, 0, roof_z), color=C["icing"]), 0.008)
    parts.append(lpm.rotate(roof, 90, "Z"))
    slope = math.degrees(math.atan2(0.34, 0.52))
    rng = random.Random(5)
    for k in range(14):
        x = -0.5 + 0.0772 * k + rng.uniform(-0.01, 0.01)
        y = -0.4 + 0.11 * (k % 3)
        zs = roof_z + 0.34 * (1 + y / 0.52) + 0.004
        dot = lpm.prism(f"candy{k}", 6, 0.03, 0.02, color=C[("red", "green", "gold")[k % 3]])
        lpm.rotate(dot, slope, "X")
        parts.append(lpm.move(dot, x, y, zs))
    for k in range(9):
        x = -0.5 + 0.125 * k
        parts.append(lpm.box(f"drip{k}", (0.07, 0.03, 0.06 if k % 2 else 0.1), at=(x, -0.52, roof_z - (0.055 if k % 2 else 0.095)), color=C["icing"]))
    parts.append(fillet(lpm.box("chimney", (0.16, 0.16, 0.32), at=(0.3, 0.12, roof_z + 0.22), color=C["ginger_dark"]), 0.008))
    parts.append(lpm.box("chimney_cap", (0.2, 0.2, 0.04), at=(0.3, 0.12, roof_z + 0.54), color=C["icing"]))
    front = -0.4
    parts.append(lpm.box("door", (0.22, 0.02, 0.3), at=(-0.1, front - 0.012, base), color=C["ginger_dark"]))
    for side in (-1, 1):
        for k in range(6):
            parts.append(lpm.box(f"jamb{side}{k}", (0.04, 0.03, 0.05), at=(-0.1 + side * 0.13, front - 0.014, base + 0.05 * k), color=C["red"] if k % 2 else C["white"]))
    for k in range(5):
        parts.append(lpm.box(f"lintel{k}", (0.06, 0.03, 0.04), at=(-0.1 + (k - 2) * 0.055, front - 0.014, base + 0.3), color=C["red"] if k % 2 else C["white"]))
    parts.append(lpm.box("knob", (0.025, 0.015, 0.025), at=(-0.03, front - 0.026, base + 0.14), color=C["gold"]))
    parts.append(lpm.box("window_frame", (0.2, 0.02, 0.2), at=(0.3, front - 0.01, base + 0.12), color=C["icing"]))
    parts.append(lpm.box("window", (0.15, 0.022, 0.15), at=(0.3, front - 0.012, base + 0.145), color=C["window"]))
    parts.append(lpm.box("mullion_h", (0.16, 0.026, 0.02), at=(0.3, front - 0.014, base + 0.21), color=C["icing"]))
    parts.append(lpm.box("mullion_v", (0.02, 0.026, 0.16), at=(0.3, front - 0.014, base + 0.14), color=C["icing"]))
    wreath = (-0.4, 0.2)
    for k in range(8):
        a = math.radians(45 * k)
        parts.append(lpm.box(f"wreath{k}", (0.05, 0.025, 0.05), at=(wreath[0] + 0.07 * math.cos(a), front - 0.012, wreath[1] + 0.07 * math.sin(a)), color=C["green_dark"] if k % 2 else C["green"]))
    for k in range(3):
        parts.append(lpm.box(f"berry{k}", (0.025, 0.02, 0.025), at=(wreath[0] + (k - 1) * 0.05, front - 0.03, wreath[1] - 0.05 + 0.02 * (k % 2)), color=C["red"]))
    parts += bow("w", (wreath[0], front - 0.035, wreath[1] + 0.065), C["red"], 0.45, facing="front")
    for k, (x, y) in enumerate(((-0.5, -0.6), (0.5, -0.62), (-0.5, 0.58))):
        disc = lpm.prism(f"mint{k}", 8, 0.075, 0.03, at=(x, y, 0.0), color=C["white"])
        parts += [disc, lpm.box(f"mintx{k}", (0.13, 0.02, 0.012), at=(x, y, 0.03), color=C["red"]), lpm.box(f"minty{k}", (0.02, 0.13, 0.012), at=(x, y, 0.03), color=C["red"])]
    for k, (x, y, h) in enumerate(((0.5, 0.58, 0.26), (0.28, 0.62, 0.2))):
        parts.append(fillet(lpm.lathe(f"gumtree{k}", [(0.09, 0), (0.0, h)], segments=6, at=(x, y, 0.0), color=C["green"]), 0.01))
        parts.append(lpm.box(f"gumdot{k}", (0.03, 0.03, 0.03), at=(x + 0.04, y - 0.04, 0.03), color=C["red"]))
    return lpm.finish("SM_WH_GingerbreadHouse", parts, P, budget=3800)


# ------------------------------------------------------------------ christmas ball
def christmas_ball():
    r, cz = 0.36, 0.43
    parts = [fillet(lpm.prism("stand", 8, 0.24, 0.07, at=(0, 0, 0), color=C["gold"], radius_top=0.14, rotate=22.5), 0.008)]
    ball = sphere("ball", r, (0, 0, cz), C["red"], segments=10, rings=8)
    lpm.paint(ball, C["gold"], lambda c, n, i: abs(c.z - (cz + 0.04)) < 0.06)
    lpm.paint(ball, C["red_dark"], lambda c, n, i: c.z < cz - 0.1 and sector(c, 10) % 2 == 0)
    parts.append(ball)
    top = cz + r
    parts.append(fillet(lpm.prism("cap", 8, 0.08, 0.07, at=(0, 0, top - 0.02), color=C["gold"], radius_top=0.065), 0.006))
    for s in (-1, 1):
        parts.append(lpm.box(f"loop_side{s}", (0.02, 0.025, 0.09), at=(s * 0.04, 0, top + 0.05), color=C["gold"]))
    parts.append(lpm.box("loop_top", (0.1, 0.025, 0.025), at=(0, 0, top + 0.14), color=C["gold"]))
    parts.append(lpm.sweep("glint", [(0, 0), (0.07, 0.02), (0.1, 0.1), (0.03, 0.08)], 0.01, at=(-0.2, -r + 0.012, cz + 0.08), color=C["white"]))
    return lpm.finish("SM_WH_Ornament", parts, P, budget=1200)


# ------------------------------------------------------------------ decorated tree
def decorated_tree():
    parts = [fillet(lpm.prism("trunk", 6, 0.1, 0.28, color=C["trunk"], radius_top=0.08), 0.006)]
    tiers = [(0.2, 0.52, 0.34), (0.42, 0.43, 0.32), (0.64, 0.34, 0.3), (0.84, 0.25, 0.28), (1.02, 0.16, 0.26)]
    for k, (z0, r, h) in enumerate(tiers):
        cone = fillet(lpm.lathe(f"tier{k}", [(r, 0), (0.0, h)], segments=8, at=(0, 0, z0), color=C["pine"]), 0.015)
        lpm.paint(cone, C["pine_dark"], lambda c, n, i: sector(c, 8) % 2 == 1)
        parts.append(cone)
        z_cap = z0 + 0.45 * h
        envelope = lambda z, r=r, z0=z0, h=h: r * (1 - (z - z0) / h)
        cap = lpm.lathe(f"snow{k}", [(envelope(z_cap) * 1.04, 0), (0.0, z0 + h + 0.03 - z_cap)], segments=8, at=(0, 0, z_cap), color=C["snow"])
        for v in cap.data.vertices:
            if abs(v.co.x) + abs(v.co.y) < 1e-6 or abs(v.co.z - z_cap) > 1e-6:
                continue
            index = round((math.atan2(v.co.y, v.co.x) % (2 * math.pi)) / (2 * math.pi / 8)) % 8
            z = z_cap + (0.08 if index % 2 else 0.0)
            scale = envelope(z) * 1.04 / math.hypot(v.co.x, v.co.y)
            v.co.x *= scale
            v.co.y *= scale
            v.co.z = z
        cap.data.update()
        parts.append(cap)

    def on_cone(z, angle, lift=0.014):
        z0, r, h = max((t for t in tiers if t[0] <= z), key=lambda t: t[0])
        radial = r * (1 - (z - z0) / h) + lift
        a = math.radians(angle)
        return radial * math.cos(a), radial * math.sin(a)

    for k in range(30):
        t = k / 29
        z = 0.3 + 1.0 * t
        x, y = on_cone(z, 360 * 3.2 * t)
        parts.append(lpm.box(f"garland{k}", (0.034, 0.034, 0.034), at=(x, y, z), color=C["gold"] if k % 3 == 0 else C["red"]))
    for k in range(22):
        t = k / 21
        z = 0.34 + 0.92 * t
        x, y = on_cone(z, 360 * 3.2 * t + 40, 0.022)
        parts.append(lpm.box(f"bulb{k}", (0.03, 0.03, 0.03), at=(x, y, z), color=C["light"]))
    for k, (z, angle, colour) in enumerate(((0.3, 20, "red"), (0.3, 200, "gold"), (0.5, 100, "red"), (0.52, 290, "blue"), (0.7, 10, "gold"), (0.72, 180, "red"), (0.9, 90, "red"), (0.92, 250, "gold"), (1.08, 320, "red"))):
        x, y = on_cone(z, angle, 0.03)
        parts.append(sphere(f"bauble{k}", 0.05, (x, y, z), C[colour], segments=6, rings=4))
    parts += bow("t", (0, -0.4, 0.4), C["red"], 1.1, facing="front")
    parts.append(lpm.sweep("star", star_outline(0.1, 0.045), 0.035, at=(0, 0, 1.3), color=C["gold"]))
    return lpm.finish("SM_WH_DecoratedTree", parts, P, budget=3800)


# ------------------------------------------------------------------ gifts
def gift(tag, size, at, color, ribbon, bow_size):
    sx, sy, sz = size
    x, y, z = at
    parts = [
        fillet(lpm.box(f"gift_{tag}", size, at=at, color=color), 0.012),
        lpm.box(f"rib_a_{tag}", (sx + 0.014, 0.06 * sx / 0.5 + 0.02, sz + 0.014), at=at, color=ribbon),
        lpm.box(f"rib_b_{tag}", (0.06 * sy / 0.5 + 0.02, sy + 0.014, sz + 0.014), at=at, color=ribbon),
    ]
    parts += bow(tag, (x, y, z + sz + 0.01), ribbon, bow_size)
    return parts


def gifts():
    parts = []
    parts += gift("red", (0.56, 0.56, 0.52), (-0.62, 0.14, 0.0), C["red"], C["gold"], 1.7)
    parts += gift("green", (0.46, 0.46, 0.42), (-0.06, 0.2, 0.0), C["green"], C["red"], 1.4)
    parts += gift("blue", (0.38, 0.38, 0.32), (0.44, 0.1, 0.0), C["blue"], C["gold"], 1.15)
    parts += gift("white", (0.26, 0.26, 0.22), (0.78, 0.16, 0.0), C["white"], C["red"], 0.8)
    parts += gift("small_white", (0.3, 0.3, 0.26), (-0.38, -0.3, 0.0), C["white"], C["blue"], 0.9)
    parts += gift("small_red", (0.28, 0.28, 0.24), (0.12, -0.24, 0.0), C["red"], C["white"], 0.85)
    parts += gift("small_green", (0.24, 0.24, 0.2), (0.58, -0.26, 0.0), C["green"], C["gold"], 0.75)
    return lpm.finish("SM_WH_Gifts", parts, P, budget=2400)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("nutcracker-1x1", nutcracker, (0.9, 0.9)),
    ("gingerbread-house-2x2", gingerbread_house, (1.8, 1.8)),
    ("christmas-ball-1x1", christmas_ball, (0.9, 0.9)),
    ("decorated-tree-1x1", decorated_tree, (0.9, 0.9)),
    ("gifts-2x1", gifts, (1.9, 0.9)),
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
