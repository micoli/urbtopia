import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("sleeper", "#8a5a34", 0.0, 0.9), ("sleeper_dark", "#6e4222", 0.0, 0.9),
    ("rail", "#b8bec9", 0.6, 0.4), ("rail_dark", "#7d8494", 0.6, 0.4),
])

# The rail pieces keep the frame of the Kenney ones, which src/scene/modelFit.ts and railModelFit.ts fit onto a tile:
# the straight piece runs along y from -4 to 0, the corner turns a quarter circle of radius 2 around (-2, 0),
# both lying from z -1 to -0.9 and 1 wide.
BOTTOM, SLEEPER_TOP, RAIL_TOP = -1.0, -0.95, -0.9
GAUGE = 0.28


def arc_band(name, r0, r1, a0, a1, z0, z1, center, color, segments):
    parts = []
    cx, cy = center
    for k in range(segments):
        b0, b1 = a0 + (a1 - a0) * k / segments, a0 + (a1 - a0) * (k + 1) / segments
        verts = [(cx + r * math.cos(b), cy + r * math.sin(b), z) for z in (z0, z1) for r, b in ((r0, b0), (r1, b0), (r1, b1), (r0, b1))]
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        parts.append(lpm._object(f"{name}{k}", lpm._bm_from(verts, faces), color))
    return parts


def straight(rng):
    parts = []
    for k in range(8):
        parts.append(lpm.box(f"s{k}", (1.0, 0.24, SLEEPER_TOP - BOTTOM), at=(0, -3.75 + 0.5 * k, BOTTOM), color=P["sleeper" if k % 2 else "sleeper_dark"]))
    for k, x in enumerate((-GAUGE, GAUGE)):
        rail = lpm.box(f"r{k}", (0.07, 4.0, RAIL_TOP - SLEEPER_TOP), at=(x, -2.0, SLEEPER_TOP), color=P["rail"])
        lpm.paint(rail, P["rail_dark"], lambda c, n, i: abs(n.x) > 0.5)
        parts.append(rail)
    return parts


def corner(rng):
    center, a0, a1 = (-2.0, 0.0), 0.0, -math.pi / 2
    parts = []
    for k in range(8):
        a = a0 + (a1 - a0) * (k + 0.5) / 8
        parts += arc_band(f"s{k}", 1.5, 2.5, a - 0.06, a + 0.06, BOTTOM, SLEEPER_TOP, center, P["sleeper" if k % 2 else "sleeper_dark"], 1)
    for k, r in enumerate((2 - GAUGE, 2 + GAUGE)):
        for seg in arc_band(f"r{k}", r - 0.035, r + 0.035, a0, a1, SLEEPER_TOP, RAIL_TOP, center, P["rail"], 12):
            lpm.paint(seg, P["rail_dark"], lambda c, n, i: abs(n.z) < 0.5)
            parts.append(seg)
    return parts


if __name__ == "__main__":
    export_all({"railroad-straight": straight, "railroad-corner-small": corner}, P, 500, HERE, center=False, ground=False)
