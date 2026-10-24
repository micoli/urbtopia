import math
import os
import random
import sys

from mathutils import Vector

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

P = lpm.Palette([
    ("bark", "#b98a55", 0.0, 0.9), ("bark_ring", "#94683c", 0.0, 0.9),
    ("frond", "#6fb043", 0.0, 0.8), ("frond_shade", "#56963a", 0.0, 0.8),
    ("coconut", "#6e4630", 0.0, 0.8),
])

# (trunk height, lean in metres at the top, frond count, frond length, coconuts)
VARIANTS = {
    "tree_palm": (1.25, 0.12, 7, 0.52, 3),
    "tree_palmBend": (1.15, 0.4, 7, 0.5, 3),
    "tree_palmShort": (0.75, 0.05, 8, 0.56, 2),
    "tree_palmTall": (1.08, 0.08, 8, 0.56, 3),
}
SEGMENTS = 6


def trunk_axis(height, lean):
    """Points along the trunk: the lean grows with the square of the height, so the base stays upright."""
    return [Vector((lean * (k / SEGMENTS) ** 2, 0, height * k / SEGMENTS)) for k in range(SEGMENTS + 1)]


def trunk(axis):
    parts = []
    for k, (a, b) in enumerate(zip(axis, axis[1:])):
        radius = 0.06 - 0.022 * k / SEGMENTS
        seg = lpm.prism(f"seg{k}", 6, radius, (b - a).length + 0.01, color=P["bark" if k % 2 else "bark_ring"], radius_top=radius * 0.82)
        direction = (b - a).normalized()
        lpm.rotate(seg, math.degrees(math.atan2(direction.x, direction.z)), "Y")
        lpm.move(seg, a.x, a.y, a.z)
        parts.append(seg)
    return parts


def frond(name, top, yaw, length, rng):
    """A drooping leaf with a diamond cross-section: a raised midrib, two blades and a thin underside."""
    stations = 4
    droop = rng.uniform(0.8, 1.1)
    verts, faces = [], []
    for k in range(stations + 1):
        t = k / stations
        reach = length * t
        z = 0.12 * t - droop * 0.45 * t * t * length
        width = 0.13 * math.sin(math.pi * min(t * 1.15, 1)) if k < stations else 0
        verts += [(reach, -width, z), (reach, 0, z + 0.025 * (1 - t)), (reach, width, z), (reach, 0, z - 0.012)]
    for k in range(stations):
        a, b = 4 * k, 4 * (k + 1)
        faces += [(a, b, b + 1, a + 1), (a + 1, b + 1, b + 2, a + 2), (a + 2, b + 2, b + 3, a + 3), (a + 3, b + 3, b, a)]
    ob = lpm._object(name, lpm._bm_from(verts, faces), P["frond"])
    lpm.paint(ob, P["frond_shade"], lambda c, n, i: n.z < 0)
    lpm.rotate(ob, yaw, "Z")
    lpm.move(ob, top.x, top.y, top.z)
    return ob


def palm(height, lean, fronds, length, coconuts, rng):
    axis = trunk_axis(height, lean)
    top = axis[-1]
    parts = trunk(axis)
    parts.append(lpm.prism("crown", 6, 0.05, 0.06, at=(top.x, top.y, top.z - 0.02), color=P["bark_ring"], radius_top=0.03))
    for k in range(fronds):
        parts.append(frond(f"f{k}", top, 360 * k / fronds + rng.uniform(-12, 12), length * rng.uniform(0.9, 1.08), rng))
    for k in range(coconuts):
        a = math.radians(360 * k / coconuts + 30)
        parts.append(lpm.lathe(f"nut{k}", [(0, -0.04), (0.04, -0.01), (0.035, 0.03), (0, 0.045)], segments=5,
                               at=(top.x + 0.05 * math.cos(a), top.y + 0.05 * math.sin(a), top.z - 0.06), color=P["coconut"]))
    return parts


def requested():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return [m for m in VARIANTS if not args or m in args]


out_dir = os.path.dirname(os.path.abspath(__file__))
for model_id in requested():
    lpm.reset()
    ob = lpm.finish(model_id, palm(*VARIANTS[model_id], random.Random(model_id)), P, budget=500, center=False)
    lpm.export_glb(ob, os.path.join(out_dir, model_id, model_id))
