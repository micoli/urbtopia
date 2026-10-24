import math
import os
import random
import sys

import bmesh

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("dirt", "#9a7452", 0.0, 1.0), ("dirt_shade", "#7d5c40", 0.0, 1.0),
    ("grass", "#7cbf4a", 0.0, 0.9), ("grass_light", "#95d15c", 0.0, 0.9),
    ("stone", "#a3a6b4", 0.0, 0.9), ("stone_shade", "#83869a", 0.0, 0.9), ("stone_light", "#c2c5d0", 0.0, 0.9),
])

# The rock_* and stone_* catalogues share their shapes: a rock is earthy with a grassy top, a stone is bare grey.
# shape: list of boulders (dx, dy, width, depth, height) inside the footprint, heights in metres.
SHAPES = {
    "largeA": [(-0.15, 0.2, 0.5, 0.55, 0.26), (0.15, -0.2, 0.45, 0.5, 0.2), (0.2, 0.25, 0.3, 0.3, 0.14)],
    "largeB": [(-0.1, 0.15, 0.55, 0.6, 0.43), (0.18, -0.25, 0.4, 0.45, 0.26)],
    "largeC": [(-0.25, 0.1, 0.55, 0.6, 0.32), (0.25, -0.15, 0.5, 0.55, 0.24), (0.1, 0.32, 0.3, 0.3, 0.16)],
    "largeD": [(-0.2, 0.0, 0.62, 0.7, 0.57), (0.28, 0.2, 0.42, 0.45, 0.3), (0.25, -0.3, 0.35, 0.35, 0.2)],
    "largeE": [(-0.25, 0.0, 0.55, 0.6, 0.29), (0.28, 0.1, 0.5, 0.5, 0.22), (0.0, -0.3, 0.3, 0.3, 0.14)],
    "largeF": [(-0.2, 0.1, 0.6, 0.6, 0.48), (0.3, -0.15, 0.45, 0.5, 0.3)],
    "smallA": [(0, 0, 0.36, 0.36, 0.19)],
    "smallB": [(0, 0, 0.36, 0.34, 0.18)],
    "smallC": [(0, 0, 0.36, 0.36, 0.12)],
    "smallD": [(-0.05, 0, 0.3, 0.32, 0.23), (0.12, 0.05, 0.18, 0.2, 0.12)],
    "smallE": [(0, 0, 0.34, 0.3, 0.26)],
    "smallF": [(0, 0, 0.33, 0.3, 0.25)],
    "smallFlatA": [(0, 0, 0.5, 0.43, 0.06)],
    "smallFlatB": [(0, 0, 0.43, 0.4, 0.06)],
    "smallFlatC": [(-0.06, 0, 0.32, 0.34, 0.06), (0.14, 0.05, 0.18, 0.2, 0.05)],
    "smallG": [(-0.1, 0.1, 0.38, 0.42, 0.25), (0.15, -0.15, 0.3, 0.32, 0.16)],
    "smallH": [(0, 0, 0.44, 0.44, 0.41)],
    "smallI": [(0, 0, 0.35, 0.4, 0.28)],
    "smallTopA": [(0, 0, 0.48, 0.48, 0.14), (0.02, 0.0, 0.28, 0.28, 0.22)],
    "smallTopB": [(0, 0, 0.6, 0.62, 0.16), (-0.05, 0.05, 0.36, 0.38, 0.28)],
    "tallA": [(-0.2, 0.0, 0.45, 0.5, 1.0), (0.25, 0.1, 0.4, 0.4, 0.62), (0.1, -0.2, 0.3, 0.3, 0.3)],
    "tallB": [(0.0, 0.05, 0.45, 0.5, 0.88), (0.18, -0.2, 0.35, 0.35, 0.5), (-0.22, -0.15, 0.25, 0.3, 0.28)],
    "tallC": [(0, 0, 0.44, 0.42, 0.78)],
    "tallD": [(0, 0, 0.42, 0.44, 0.77)],
    "tallE": [(0, 0, 0.44, 0.5, 0.44)],
    "tallF": [(0, 0, 0.42, 0.48, 0.57)],
    "tallG": [(0, 0, 0.4, 0.46, 0.78)],
    "tallH": [(-0.05, 0.05, 0.45, 0.5, 0.71), (0.15, -0.18, 0.28, 0.28, 0.32)],
    "tallI": [(0, 0, 0.44, 0.44, 0.81)],
    "tallJ": [(0, 0, 0.47, 0.52, 0.62)],
}


def boulder(name, rng, dx, dy, width, depth, height):
    """Convex hull of a jittered ring of points: a faceted block wider at the base than at the top."""
    bm = bmesh.new()
    sides = rng.choice((5, 6, 7))
    for level, (z, spread) in enumerate(((0.0, 1.0), (0.55, 0.92), (1.0, 0.55))):
        for k in range(sides):
            a = 2 * math.pi * (k + rng.uniform(-0.25, 0.25) + level * 0.5) / sides
            r = 0.5 * spread * rng.uniform(0.82, 1.0)
            bm.verts.new((dx + width * r * math.cos(a), dy + depth * r * math.sin(a), height * (z if level < 2 else rng.uniform(0.9, 1.0))))
    hull = bmesh.ops.convex_hull(bm, input=bm.verts)
    bmesh.ops.delete(bm, geom=[v for v in hull["geom_interior"] if isinstance(v, bmesh.types.BMVert)], context="VERTS")
    return lpm._object(name, bm, P["stone"])


def paint(ob, kind):
    if kind == "rock":
        lpm.paint(ob, P["dirt"])
        lpm.paint(ob, P["dirt_shade"], lambda c, n, i: n.x + n.y < -0.6)
        lpm.paint(ob, P["grass"], lambda c, n, i: n.z > 0.55)
        lpm.paint(ob, P["grass_light"], lambda c, n, i: n.z > 0.55 and n.x > 0.15)
    else:
        lpm.paint(ob, P["stone_shade"], lambda c, n, i: n.x + n.y < -0.6)
        lpm.paint(ob, P["stone_light"], lambda c, n, i: n.z > 0.75)


MODELS = [(f"{kind}_{shape}", kind, shape) for kind in ("rock", "stone") for shape in SHAPES]


def requested():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [m for m in MODELS if not args or m[0] in args]


out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id, kind, shape in requested():
    lpm.reset()
    rng = random.Random(shape)
    parts = []
    for k, spec in enumerate(SHAPES[shape]):
        ob = boulder(f"b{k}", rng, *spec)
        paint(ob, kind)
        parts.append(ob)
    ob = lpm.finish(model_id, parts, P, budget=300, center=False)
    lpm.export_glb(ob, os.path.join(out_dir, model_id, model_id))
