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
    ("snow", "#f4f8ff"), ("snow_shade", "#d6e4f5"), ("ice_pale", "#cfe6f7"), ("ice", "#8fd0f0"), ("ice_deep", "#3f86c8"),
    ("pine", "#2f7a3a"), ("pine_dark", "#226030"), ("trunk", "#6e4630"),
    ("wood", "#a8683a"), ("wood_dark", "#6e4222"), ("rope", "#c8a060"),
    ("red", "#d83a3a"), ("red_dark", "#a82424"), ("coal", "#26262e"), ("carrot", "#f28a1c"),
    ("gold", "#f4c430", 0.5, 0.4), ("blue", "#4a78c2"), ("green", "#3f9a4a"), ("purple", "#8a5ac0"), ("yellow", "#f4c430"),
    ("teddy", "#b07040"), ("teddy_light", "#d8a068"), ("sack", "#b08850"), ("white", "#ffffff"),
])
C = {n: P[n] for n, *_ in P.entries}


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


def ball(name, r, centre, color, segments=8):
    profile = [(0, 0)] + [(r * math.cos(math.radians(a)), r + r * math.sin(math.radians(a))) for a in (-60, -30, 0, 30, 60)] + [(0, 2 * r)]
    return lpm.lathe(name, profile, segments=segments, at=(centre[0], centre[1], centre[2] - r), color=color)


def star_outline(outer, inner):
    return [((outer if i % 2 == 0 else inner) * math.cos(math.radians(90 + 36 * i)), (outer if i % 2 == 0 else inner) * math.sin(math.radians(90 + 36 * i))) for i in range(10)]


def gift(tag, size, at, color, ribbon):
    sx, sy, sz = size
    x, y, z = at
    return [
        fillet(lpm.box(f"gift_{tag}", size, at=at, color=color), 0.01, color),
        lpm.box(f"rib_a_{tag}", (sx + 0.012, 0.035, sz + 0.012), at=at, color=ribbon),
        lpm.box(f"rib_b_{tag}", (0.035, sy + 0.012, sz + 0.012), at=at, color=ribbon),
        lpm.box(f"bow_{tag}", (0.07, 0.07, 0.04), at=(x, y, z + sz + 0.006), color=ribbon),
    ]


# ------------------------------------------------------------------ sled
def sled():
    runner = [(-0.5, 0.0), (0.28, 0.0), (0.4, 0.05), (0.5, 0.17), (0.5, 0.26), (0.43, 0.26), (0.39, 0.13), (0.28, 0.06), (-0.5, 0.06)]
    parts = []
    for s in (-1, 1):
        parts.append(lpm.sweep(f"runner{s}", runner, 0.04, at=(0, s * 0.17, 0), color=C["wood"]))
        parts.append(lpm.box(f"rail{s}", (0.9, 0.04, 0.04), at=(0.0, s * 0.2, 0.15), color=C["wood_dark"]))
        for x in (-0.35, 0.2):
            parts.append(lpm.box(f"post{s}{x}", (0.05, 0.05, 0.13), at=(x, s * 0.17, 0.04), color=C["wood_dark"]))
    for k in range(5):
        parts.append(lpm.box(f"slat{k}", (0.1, 0.5, 0.03), at=(-0.36 + 0.14 * k, 0, 0.18), color=C["red"]))
    parts.append(lpm.box("bar", (0.04, 0.4, 0.04), at=(0.46, 0, 0.2), color=C["rope"]))
    for p in parts:
        lpm.rotate(p, -90, "Z")
    return lpm.finish("SM_WI_Sled", parts, P, budget=700)


# ------------------------------------------------------------------ snowy christmas tree
def snowy_fir():
    parts = [lpm.prism("trunk", 6, 0.08, 0.3, color=C["trunk"], radius_top=0.065)]
    tiers = [(0.2, 0.5, 0.34), (0.46, 0.4, 0.32), (0.72, 0.3, 0.3), (0.96, 0.2, 0.28)]
    for k, (z0, r, h) in enumerate(tiers):
        cone = fillet(lpm.lathe(f"tier{k}", [(r, 0), (0.0, h)], segments=8, at=(0, 0, z0), color=C["pine"]), 0.015, C["pine"])
        lpm.paint(cone, C["pine_dark"], lambda c, n, i: sector(c, 8) % 2 == 1)
        parts.append(cone)
        z_cap = z0 + 0.42 * h
        green = lambda z, r=r, z0=z0, h=h: r * (1 - (z - z0) / h)
        cap = lpm.lathe(f"snow{k}", [(green(z_cap) * 1.04, 0), (0.0, z0 + h + 0.03 - z_cap)], segments=8, at=(0, 0, z_cap), color=C["snow"])
        for v in cap.data.vertices:
            if abs(v.co.x) + abs(v.co.y) < 1e-6 or abs(v.co.z - z_cap) > 1e-6:
                continue
            index = round((math.atan2(v.co.y, v.co.x) % (2 * math.pi)) / (2 * math.pi / 8)) % 8
            z = z_cap + (0.07 if index % 2 else 0.0)
            scale = green(z) * 1.04 / math.hypot(v.co.x, v.co.y)
            v.co.x *= scale
            v.co.y *= scale
            v.co.z = z
        cap.data.update()
        parts.append(cap)
    for tier, frac, angle, color in ((0, 0.22, 40, "red"), (0, 0.18, 170, "gold"), (0, 0.25, 290, "blue"), (1, 0.25, 90, "gold"),
                                     (1, 0.2, 220, "red"), (2, 0.25, 330, "blue"), (2, 0.2, 140, "red"), (3, 0.25, 10, "gold")):
        z0, r, h = tiers[tier]
        z = z0 + frac * h
        radial = r * (1 - frac) + 0.01
        a = math.radians(angle)
        parts.append(ball(f"bauble{tier}{angle}", 0.035, (radial * math.cos(a), radial * math.sin(a), z), C[color], segments=6))
    parts.append(lpm.sweep("star", star_outline(0.08, 0.035), 0.03, at=(0, 0, 1.33), color=C["gold"]))
    parts.append(lpm.lathe("ground", [(0.58, 0), (0.56, 0.03), (0.4, 0.06), (0.0, 0.06)], segments=8, color=C["snow"]))
    for k, (x, y, r) in enumerate(((0.4, 0.3, 0.11), (-0.42, -0.22, 0.1), (0.3, -0.4, 0.08))):
        mound = ball(f"mound{k}", r, (x, y, 0.03), C["snow"], segments=6)
        parts.append(lpm.scale(mound, 1, 1, 0.6, about=(x, y, 0.0)))
    return lpm.finish("SM_WI_SnowyFir", parts, P, budget=1100)


# ------------------------------------------------------------------ igloo
def igloo():
    rng = random.Random(3)
    ring = lpm.lathe("ring", [(0.72, 0.0), (0.7, 0.03), (0.62, 0.06), (0.5, 0.06)], segments=10, color=C["snow"])
    for v in ring.data.vertices:
        f = rng.uniform(0.92, 1.08)
        v.co.x *= f
        v.co.y *= f
    ring.data.update()
    fillet(ring, 0.01, C["snow"])
    dome = fillet(lpm.lathe("dome", [(0.55, 0), (0.498, 0.232), (0.354, 0.421), (0.142, 0.531), (0.0, 0.55)], segments=12, at=(0, 0, 0.05), color=C["snow"]), 0.01, C["snow"])
    lpm.paint(dome, C["snow_shade"], lambda c, n, i: (sector(c, 12) + int(c.z / 0.13)) % 2 == 1)
    lpm.paint(dome, C["ice_pale"], lambda c, n, i: (sector(c, 12) * 7 + int(c.z / 0.13) * 3) % 5 == 0)
    arch = [(-0.19, 0), (0.19, 0), (0.19, 0.17), (0.13, 0.26), (0, 0.3), (-0.13, 0.26), (-0.19, 0.17)]
    tunnel = fillet(lpm.sweep("tunnel", arch, 0.34, at=(0, -0.46, 0.05), color=C["snow"]), 0.01, C["snow"])
    opening = lpm.sweep("opening", [(x * 0.62, z * 0.85) for x, z in arch], 0.02, at=(0, -0.63, 0.05), color=C["ice_deep"])
    return lpm.finish("SM_WI_Igloo", [ring, dome, tunnel, opening], P, budget=800)


# ------------------------------------------------------------------ snowman
def snowman():
    parts = []
    for tag, r, z in (("bottom", 0.3, 0.3), ("middle", 0.22, 0.68), ("head", 0.16, 0.96)):
        body = fillet(ball(tag, r, (0, 0, z), C["snow"]), 0.012, C["snow"], min_angle=0.7)
        lpm.paint(body, C["snow_shade"], lambda c, n, i: sector(c, 8) % 2 == 1)
        parts.append(body)
    for k, (x, z) in enumerate(((-0.055, 1.0), (0.055, 1.0))):
        parts.append(lpm.box(f"eye{k}", (0.03, 0.03, 0.03), at=(x, -0.13, z), color=C["coal"]))
    for k, (x, z) in enumerate(((-0.075, 0.92), (-0.035, 0.895), (0.035, 0.895), (0.075, 0.92))):
        parts.append(lpm.box(f"smile{k}", (0.022, 0.022, 0.022), at=(x, -0.13, z), color=C["coal"]))
    nose = lpm.prism("nose", 4, 0.035, 0.14, at=(0, -0.13, 0.96), color=C["carrot"], radius_top=0.006)
    parts.append(lpm.rotate(nose, 90, "X", about=(0, -0.13, 0.96)))
    for k, (z, y) in enumerate(((0.56, -0.184), (0.4, -0.283), (0.27, -0.299))):
        parts.append(lpm.box(f"button{k}", (0.035, 0.03, 0.035), at=(0, y, z), color=C["coal"]))
    parts.append(fillet(lpm.lathe("scarf", [(0.15, 0.0), (0.23, 0.0), (0.23, 0.08), (0.15, 0.08)], segments=8, at=(0, 0, 0.74), color=C["red"]), 0.01, C["red"]))
    parts.append(fillet(lpm.box("scarf_tail", (0.06, 0.04, 0.26), at=(0.1, -0.2, 0.5), color=C["red_dark"]), 0.008, C["red_dark"]))
    for s in (-1, 1):
        arm = lpm.prism(f"arm{s}", 4, 0.018, 0.4, at=(s * 0.18, 0, 0.66), color=C["trunk"], radius_top=0.008)
        parts.append(lpm.rotate(arm, s * 62, "Y", about=(s * 0.18, 0, 0.66)))
        twig = lpm.prism(f"twig{s}", 4, 0.012, 0.12, at=(s * 0.18, 0, 0.66), color=C["trunk"], radius_top=0.006)
        lpm.move(twig, s * 0.26, 0, 0.19)
        parts.append(lpm.rotate(twig, s * 20, "Y", about=(s * 0.44, 0, 0.85)))
    parts.append(fillet(lpm.prism("hat_brim", 8, 0.2, 0.03, at=(0, 0, 1.06), color=C["coal"]), 0.008, C["coal"]))
    parts.append(fillet(lpm.prism("hat", 8, 0.12, 0.22, at=(0, 0, 1.08), color=C["coal"], radius_top=0.11), 0.008, C["coal"]))
    parts.append(lpm.prism("hat_band", 8, 0.126, 0.05, at=(0, 0, 1.09), color=C["red"], radius_top=0.123))
    return lpm.finish("SM_WI_Snowman", parts, P, budget=1100)


# ------------------------------------------------------------------ santa's sleigh with toys
def sleigh():
    parts = []
    runner = [(-0.85, 0.0), (0.6, 0.0), (0.75, 0.05), (0.85, 0.16), (0.85, 0.24), (0.78, 0.24), (0.72, 0.12), (0.6, 0.05), (-0.85, 0.05)]
    panel = [(-0.7, 0.2), (0.6, 0.2), (0.72, 0.3), (0.74, 0.45), (0.62, 0.47), (0.58, 0.36), (0.5, 0.3), (-0.35, 0.3), (-0.6, 0.55), (-0.74, 0.58)]
    for s in (-1, 1):
        parts.append(fillet(lpm.sweep(f"runner{s}", runner, 0.04, at=(0, s * 0.27, 0), color=C["gold"]), 0.008, C["gold"]))
        parts.append(fillet(lpm.sweep(f"panel{s}", panel, 0.05, at=(0, s * 0.255, 0), color=C["red"]), 0.01, C["red"]))
        for x in (-0.6, -0.1, 0.4):
            parts.append(fillet(lpm.box(f"post{s}{x}", (0.05, 0.05, 0.2), at=(x, s * 0.27, 0.04), color=C["gold"]), 0.008, C["gold"]))
    parts.append(fillet(lpm.box("floor", (1.4, 0.5, 0.05), at=(-0.04, 0, 0.17), color=C["red_dark"]), 0.01, C["red_dark"]))
    parts.append(fillet(lpm.box("back", (0.05, 0.5, 0.3), at=(-0.72, 0, 0.2), color=C["red"]), 0.01, C["red"]))
    parts.append(fillet(lpm.box("front", (0.05, 0.5, 0.22), at=(0.64, 0, 0.2), color=C["red_dark"]), 0.01, C["red_dark"]))
    sack = lpm.lathe("sack", [(0.0, 0), (0.2, 0.02), (0.26, 0.15), (0.22, 0.3), (0.12, 0.34), (0.17, 0.4), (0.06, 0.42)], segments=8, at=(-0.48, 0, 0.22), color=C["sack"])
    parts += [fillet(sack, 0.012, C["sack"]), lpm.prism("sack_tie", 8, 0.125, 0.04, at=(-0.48, 0, 0.55), color=C["red"], radius_top=0.115)]
    parts += gift("blue", (0.28, 0.24, 0.24), (-0.02, -0.08, 0.22), C["blue"], C["yellow"])
    parts += gift("green", (0.22, 0.2, 0.2), (0.26, 0.1, 0.22), C["green"], C["red"])
    parts += gift("purple", (0.18, 0.18, 0.16), (0.44, -0.1, 0.22), C["purple"], C["white"])
    parts += gift("yellow", (0.14, 0.14, 0.12), (0.26, 0.1, 0.44), C["yellow"], C["blue"])
    teddy_at = (-0.02, -0.08, 0.46)
    parts.append(ball("teddy_body", 0.075, (teddy_at[0], teddy_at[1], teddy_at[2] + 0.07), C["teddy"], segments=6))
    parts.append(ball("teddy_head", 0.06, (teddy_at[0], teddy_at[1], teddy_at[2] + 0.2), C["teddy"], segments=6))
    parts.append(ball("teddy_snout", 0.025, (teddy_at[0], teddy_at[1] - 0.05, teddy_at[2] + 0.19), C["teddy_light"], segments=6))
    for s in (-1, 1):
        parts.append(ball(f"teddy_ear{s}", 0.025, (teddy_at[0] + s * 0.05, teddy_at[1], teddy_at[2] + 0.255), C["teddy"], segments=6))
    return lpm.finish("SM_WI_Sleigh", parts, P, budget=2600)


# ------------------------------------------------------------------ snow and ice castle
def merlons(parts, tag, start, end, z, depth_axis, n):
    for i in range(n):
        t = (i + 0.5) / n
        x, y = start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t
        size = (0.1, 0.2, 0.1) if depth_axis == "y" else (0.2, 0.1, 0.1)
        parts.append(fillet(lpm.box(f"mer_{tag}{i}", size, at=(x, y, z), color=C["snow_shade"]), 0.01, C["snow_shade"]))


def castle():
    rng = random.Random(9)
    outline = [(0.95 * math.cos(math.radians(22.5 + 45 * k)) * rng.uniform(0.96, 1.04), 0.95 * math.sin(math.radians(22.5 + 45 * k)) * rng.uniform(0.96, 1.04)) for k in range(8)]
    parts = [lpm.sweep("slab", outline, 0.06, color=C["snow"], axis="z")]
    wall_height = 0.42
    for s in (-1, 1):
        parts.append(fillet(lpm.box(f"front{s}", (0.4, 0.18, wall_height), at=(s * 0.35, -0.65, 0.06), color=C["snow"]), 0.015, C["snow"]))
        parts.append(fillet(lpm.box(f"side{s}", (0.18, 1.1, wall_height), at=(s * 0.65, 0, 0.06), color=C["snow"]), 0.015, C["snow"]))
        merlons(parts, f"f{s}", (s * 0.19, -0.65), (s * 0.51, -0.65), 0.48, "y", 2)
        merlons(parts, f"s{s}", (s * 0.65, -0.45), (s * 0.65, 0.45), 0.48, "x", 4)
    parts.append(fillet(lpm.box("back", (1.1, 0.18, wall_height), at=(0, 0.65, 0.06), color=C["snow"]), 0.015, C["snow"]))
    merlons(parts, "b", (-0.45, 0.65), (0.45, 0.65), 0.48, "y", 4)
    lintel = [(-0.17, 0.18), (-0.17, 0.42), (0.17, 0.42), (0.17, 0.18), (0.15, 0.18), (0.15, 0.24), (0.08, 0.3), (0.0, 0.32), (-0.08, 0.3), (-0.15, 0.24), (-0.15, 0.18)]
    parts.append(fillet(lpm.sweep("lintel", lintel, 0.18, at=(0, -0.65, 0.06), color=C["ice"]), 0.01, C["ice"]))
    parts.append(lpm.box("gate_back", (0.3, 0.04, 0.26), at=(0, -0.54, 0.06), color=C["ice_deep"]))
    flags = {(-1, 1), (1, -1)}
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * 0.65, sy * 0.65
            tower = fillet(lpm.prism(f"tower{sx}{sy}", 8, 0.2, 0.8, at=(x, y, 0.06), color=C["snow"], radius_top=0.19), 0.012, C["snow"])
            lpm.paint(tower, C["snow_shade"], lambda c, n, i, x=x, y=y: sector(c - Vector((x, y, 0)), 8) % 2 == 1)
            parts.append(tower)
            parts.append(lpm.prism(f"band{sx}{sy}", 8, 0.212, 0.06, at=(x, y, 0.5), color=C["ice"]))
            for k in range(6):
                a = math.radians(60 * k)
                merlon = fillet(lpm.box(f"tm{sx}{sy}{k}", (0.08, 0.08, 0.1), at=(x + 0.16 * math.cos(a), y + 0.16 * math.sin(a), 0.86), color=C["snow_shade"]), 0.008, C["snow_shade"])
                parts.append(lpm.rotate(merlon, 60 * k, "Z", about=(x + 0.16 * math.cos(a), y + 0.16 * math.sin(a), 0)))
            if (sx, sy) in flags:
                parts.append(lpm.prism(f"pole{sx}{sy}", 4, 0.012, 0.34, at=(x, y, 0.86), color=C["wood_dark"]))
                parts.append(lpm.sweep(f"flag{sx}{sy}", [(0, 0), (0.17, 0.045), (0, 0.09)], 0.012, at=(x + 0.012, y, 1.1), color=C["red"]))
    for k, (x, y, height, tilt) in enumerate(((0.0, 0.12, 0.8, 0), (0.16, 0.2, 0.62, 12), (-0.15, 0.17, 0.55, -14), (0.05, -0.15, 0.4, 8))):
        crystal = lpm.prism(f"crystal{k}", 4, 0.07, height, at=(x, y, 0.06), color=C["ice"] if k % 2 else C["ice_pale"], radius_top=0.006, rotate=15)
        parts.append(lpm.rotate(crystal, tilt, "Y", about=(x, y, 0.06)))
    for k, (x, y, r) in enumerate(((-0.6, -0.82, 0.09), (-0.42, -0.86, 0.07), (0.55, -0.84, 0.1), (0.72, -0.78, 0.07), (0.3, -0.88, 0.06))):
        parts.append(ball(f"snowball{k}", r, (x, y, 0.06 + r), C["snow"], segments=6))
    return lpm.finish("SM_WI_Castle", parts, P, budget=3200)


# ------------------------------------------------------------------ footprints and export
MODELS = [
    # (id, builder, footprint width x depth in tiles)
    ("sled-1x1", sled, (0.9, 0.9)),
    ("snowy-fir-1x1", snowy_fir, (0.9, 0.9)),
    ("igloo-1x1", igloo, (0.9, 0.9)),
    ("snowman-1x1", snowman, (0.9, 0.9)),
    ("sleigh-2x1", sleigh, (2.0, 1.0)),
    ("snow-castle-2x2", castle, (1.8, 1.8)),
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
