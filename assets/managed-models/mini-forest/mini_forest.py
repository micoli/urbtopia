import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "nature"))
import pines  # noqa: E402
import plants  # noqa: E402
import rocks  # noqa: E402
from model_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("wood", "#b97a4a", 0.0, 0.9), ("wood_dark", "#8a5a34", 0.0, 0.9), ("wood_light", "#d49a64", 0.0, 0.9),
    ("roof", "#5a7fd6", 0.0, 0.8), ("roof_dark", "#4462b0", 0.0, 0.8), ("moss", "#7cbf4a", 0.0, 0.9),
    ("canvas", "#5a8fd6", 0.0, 0.85), ("canvas_dark", "#3f6cb0", 0.0, 0.85), ("inside", "#22304a", 0.0, 1.0),
    ("rope", "#e3d2a8", 0.0, 0.9),
])

# Bounding boxes of the Kenney models these replace, in Blender axes: the game places them by their raw coordinates.
BOXES = {
    "building-platform": ((-0.65, -0.65, 0.0), (0.65, 0.65, 0.5)),
    "building-roof": ((-0.67, -0.58, 0.0), (0.67, 0.58, 1.05)),
    "patch-grass": ((-0.5, -0.5, 0.0), (0.5, 0.5, 0.17)),
    "plant": ((-0.15, -0.22, -0.02), (0.25, 0.22, 0.17)),
    "rocks-high": ((-0.5, -0.5, -0.5), (0.5, 0.5, 0.5)),
    "rocks-low": ((-0.5, -0.5, 0.0), (0.5, 0.5, 0.52)),
    "rocks-ramp": ((-0.5, -0.5, 0.0), (0.5, 0.5, 0.5)),
    "stones": ((-0.45, -0.45, 0.0), (0.45, 0.4, 0.45)),
    "tent": ((-0.63, -0.54, 0.0), (0.63, 0.54, 1.0)),
    "tree": ((-0.46, -0.44, 0.0), (0.46, 0.44, 1.68)),
    "tree-high": ((-0.46, -0.44, 0.0), (0.46, 0.44, 2.28)),
}


def post(name, x, y, height, radius=0.05):
    return lpm.prism(name, 6, radius, height, at=(x, y, 0), color=P["wood_dark"])


def platform(rng):
    """A square wooden deck on legs, a post at each corner and a rail on two sides."""
    parts = []
    for k in range(6):
        plank = lpm.box(f"plank{k}", (1.2, 0.19, 0.05), at=(0, -0.5 + 0.2 * k, 0.25), color=P["wood" if k % 2 else "wood_light"])
        parts.append(plank)
    for k, (x, y) in enumerate(((-0.55, -0.55), (0.55, -0.55), (0.55, 0.55), (-0.55, 0.55))):
        parts.append(post(f"post{k}", x, y, 0.5, 0.06))
    for k, (x, y, sx, sy) in enumerate(((0, 0.55, 1.1, 0.05), (-0.55, 0, 0.05, 1.1))):
        parts.append(lpm.box(f"rail{k}", (sx, sy, 0.05), at=(x, y, 0.42), color=P["wood"]))
    return parts


def shelter(rng):
    """Four posts under a gabled blue roof whose ridge runs along y, with moss patches."""
    parts = [post(f"post{k}", x, y, 0.75) for k, (x, y) in enumerate(((-0.45, -0.4), (0.45, -0.4), (0.45, 0.4), (-0.45, 0.4)))]
    slope = math.radians(28)
    for k, side in enumerate((-1, 1)):
        slab = lpm.box(f"roof{k}", (0.72, 1.16, 0.06), at=(0.36, 0, 0), color=P["roof"])
        lpm.paint(slab, P["roof_dark"], lambda c, n, i: n.z < -0.5)
        lpm.rotate(slab, 28, "Y")
        lpm.scale(slab, side, 1, 1)
        parts.append(lpm.move(slab, 0, 0, 1.0))
        for m in range(3):
            d = 0.2 + 0.12 * m
            spot = lpm.prism(f"moss{k}{m}", 5, 0.05, 0.02, color=P["moss"])
            lpm.rotate(spot, side * 28, "Y")
            parts.append(lpm.move(spot, side * d, rng.uniform(-0.4, 0.4), 1.05 - d * math.tan(slope)))
    return parts


def tent(rng):
    """A blue ridge tent whose ridge runs along y, between two poles."""
    verts = [(x, y, z) for y in (-0.45, 0.45) for x, z in ((-0.55, 0), (0.55, 0), (0, 0.9))]
    faces = [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]
    body = lpm._object("body", lpm._bm_from(verts, faces), P["canvas"])
    lpm.paint(body, P["canvas_dark"], lambda c, n, i: n.x < -0.3 or abs(n.y) > 0.5)
    door = lpm._object("door", lpm._bm_from([(x, y, z) for y in (-0.455, -0.45) for x, z in ((-0.25, 0), (0.25, 0), (0, 0.6))], faces), P["inside"])
    parts = [body, door]
    for k, y in enumerate((-0.5, 0.5)):
        parts.append(lpm.prism(f"pole{k}", 5, 0.025, 1.0, at=(0, y, 0), color=P["wood_dark"]))
    for k, (x, y) in enumerate(((-0.62, -0.4), (0.62, -0.4), (-0.62, 0.4), (0.62, 0.4))):
        parts.append(lpm.prism(f"peg{k}", 4, 0.02, 0.05, at=(x, y, 0), color=P["wood"]))
    return parts


def mini_tree(tiers, crown):
    def build(rng):
        parts = pines.pine(0.25, tiers, 0.4, 0.16, crown, "round", rng)
        bush = lpm.lathe("bush", [(0.1, 0), (0.12, 0.06), (0, 0.14)], segments=6, at=(0.22, -0.18, 0), color=pines.P["needle_light"])
        return parts + [bush]
    return build


def rock_block(specs):
    def build(rng):
        parts = []
        for k, spec in enumerate(specs):
            ob = rocks.boulder(f"b{k}", rng, *spec)
            rocks.paint(ob, "stone")
            parts.append(ob)
        return parts
    return build


def ramp(rng):
    """A rocky slope, high on its -x side and low on its +x side."""
    verts = [(-0.5, -0.5, 0), (0.5, -0.5, 0), (0.5, 0.5, 0), (-0.5, 0.5, 0), (-0.5, -0.5, 0.5), (0.5, -0.5, 0.1), (0.5, 0.5, 0.1), (-0.5, 0.5, 0.5)]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    body = lpm._object("ramp", lpm._bm_from(verts, faces), rocks.P["stone"])
    rocks.paint(body, "stone")
    parts = [body]
    for k in range(3):
        ob = rocks.boulder(f"b{k}", rng, -0.3 + 0.3 * k, rng.uniform(-0.3, 0.3), 0.3, 0.3, 0.45 - 0.13 * k)
        rocks.paint(ob, "stone")
        parts.append(ob)
    return parts


def patch(rng):
    disc = lpm.prism("patch", 9, 0.5, 0.03, color=plants.P["grass"], rotate=rng.uniform(0, 40))
    lpm.paint(disc, plants.P["grass_shade"], lambda c, n, i: abs(n.z) < 0.5)
    return [disc] + plants.tuft(rng, 6, 0.35, 0.14)


if __name__ == "__main__":
    finish = {"center": False, "ground": False}
    export_all({"building-platform": platform, "building-roof": shelter, "tent": tent}, P, 600, HERE, boxes=BOXES, **finish)
    export_all({"tree": mini_tree(3, 1.3), "tree-high": mini_tree(4, 1.9)}, pines.P, 400, HERE, boxes=BOXES, **finish)
    export_all({
        "rocks-high": rock_block([(-0.2, -0.15, 0.6, 0.65, 1.0), (0.2, 0.2, 0.6, 0.6, 0.8)]),
        "rocks-low": rock_block([(-0.2, -0.1, 0.6, 0.7, 0.52), (0.22, 0.2, 0.55, 0.55, 0.4)]),
        "rocks-ramp": ramp,
        "stones": rock_block([(-0.2, -0.15, 0.35, 0.35, 0.45), (0.2, 0.05, 0.3, 0.3, 0.3), (-0.05, 0.25, 0.25, 0.25, 0.2)]),
    }, rocks.P, 400, HERE, boxes=BOXES, **finish)
    export_all({"patch-grass": patch, "plant": plants.leafs(4, 0.18)}, plants.P, 300, HERE, boxes=BOXES, **finish)
