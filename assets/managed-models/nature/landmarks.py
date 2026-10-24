import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nature_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("stone", "#b9bccb", 0.0, 0.9), ("stone_dark", "#8f93a6", 0.0, 0.9), ("stone_light", "#d3d6e0", 0.0, 0.9),
    ("moss", "#7cbf4a", 0.0, 0.9),
    ("canvas", "#d84a3a", 0.0, 0.85), ("canvas_dark", "#a8352a", 0.0, 0.85), ("inside", "#5a2018", 0.0, 1.0),
    ("wood", "#8a5a34", 0.0, 0.9), ("rope", "#e3d2a8", 0.0, 0.9),
])


def shade(ob):
    lpm.paint(ob, P["stone_dark"], lambda c, n, i: n.x + n.y < -0.6)
    lpm.paint(ob, P["stone_light"], lambda c, n, i: n.z > 0.6)
    return ob


def plinth(size, height):
    return shade(lpm.box("plinth", (size, size, height), color=P["stone"], taper=(0.9, 0.9)))


def column(rng):
    """A fluted column broken off near the top, standing on a square plinth, its fallen piece at its foot."""
    parts = [plinth(0.3, 0.1)]
    shaft = lpm.prism("shaft", 10, 0.1, 0.78, at=(0, 0, 0.1), color=P["stone"], radius_top=0.09)
    lpm.paint(shaft, P["stone_dark"], lambda c, n, i: i % 2 == 0 and abs(n.z) < 0.5)
    parts.append(shaft)
    for k in range(4):
        a = 2 * math.pi * k / 4 + rng.uniform(-0.3, 0.3)
        tooth = lpm.prism(f"break{k}", 3, 0.05, rng.uniform(0.03, 0.1), at=(0.05 * math.cos(a), 0.05 * math.sin(a), 0.87),
                          color=P["stone"], radius_top=0.01, rotate=math.degrees(a))
        parts.append(shade(tooth))
    parts.append(lpm.prism("base", 10, 0.13, 0.05, at=(0, 0, 0.1), color=P["stone_light"], radius_top=0.11))
    moss = lpm.prism("moss", 6, 0.12, 0.02, at=(0.0, 0.0, 0.1), color=P["moss"])
    lpm.scale(moss, 1.25, 1.25, 1)
    return parts + [moss]


def head(rng):
    """A tall weathered stone head with a heavy brow, a long nose and a closed mouth, facing -y."""
    parts = []
    face = lpm.box("head", (0.5, 0.42, 0.95), color=P["stone"], taper=(0.85, 0.8))
    parts.append(shade(face))
    brow = lpm.box("brow", (0.46, 0.08, 0.08), at=(0, -0.2, 0.62), color=P["stone_dark"])
    nose = lpm.box("nose", (0.1, 0.12, 0.28), at=(0, -0.22, 0.38), color=P["stone"], taper=(0.7, 0.4))
    mouth = lpm.box("mouth", (0.22, 0.04, 0.03), at=(0, -0.2, 0.26), color=P["stone_dark"])
    chin = lpm.box("chin", (0.32, 0.06, 0.1), at=(0, -0.19, 0.12), color=P["stone"])
    for k, side in enumerate((-1, 1)):
        ear = lpm.box(f"ear{k}", (0.05, 0.12, 0.3), at=(side * 0.24, 0.0, 0.4), color=P["stone_dark"])
        parts.append(ear)
    parts += [brow, shade(nose), mouth, shade(chin)]
    parts.append(lpm.box("moss", (0.42, 0.34, 0.02), at=(0, 0.02, 0.95), color=P["moss"], taper=(0.9, 0.9)))
    return parts


def obelisk(rng):
    parts = [plinth(0.31, 0.08)]
    shaft = lpm.box("shaft", (0.18, 0.18, 0.68), at=(0, 0, 0.08), color=P["stone"], taper=(0.7, 0.7))
    parts.append(shade(shaft))
    tip = lpm.prism("tip", 4, 0.09 * 0.7 * math.sqrt(2), 0.12, at=(0, 0, 0.76), color=P["stone_light"], radius_top=0.0, rotate=45)
    return parts + [shade(tip)]


def ring(rng):
    """A standing stone ring on a low base."""
    parts = [shade(lpm.box("base", (0.6, 0.3, 0.12), color=P["stone"], taper=(0.92, 0.85)))]
    segments, radius, thickness = 12, 0.27, 0.09
    for k in range(segments):
        a0, a1 = 2 * math.pi * k / segments, 2 * math.pi * (k + 1) / segments
        verts = []
        for y in (-0.07, 0.07):
            for r, a in ((radius, a0), (radius, a1), (radius - thickness, a1), (radius - thickness, a0)):
                verts.append((r * math.cos(a), y, 0.47 + r * math.sin(a)))
        faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        seg = lpm._object(f"s{k}", lpm._bm_from(verts, faces), P["stone"])
        parts.append(shade(seg))
    return parts


def ridge(name, length, width, height, x, color):
    """A closed triangular prism along x, apex up: the body of a ridge tent."""
    verts = [(x0, y, z) for x0 in (x - length / 2, x + length / 2) for y, z in ((-width / 2, 0), (width / 2, 0), (0, height))]
    faces = [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]
    return lpm._object(name, lpm._bm_from(verts, faces), color)


def tent(open_front):
    """A ridge tent along x on wooden poles; the open one shows its dark inside and folded flaps at the -x end."""
    def build(rng):
        length, width, height = 0.8, 0.6, 0.5
        body = ridge("body", length, width, height, 0, P["canvas"])
        lpm.paint(body, P["canvas_dark"], lambda c, n, i: n.y < -0.3 or abs(n.x) > 0.5)
        parts = [body]
        if open_front:
            parts.append(ridge("door", 0.01, width * 0.6, height * 0.75, -length / 2 - 0.003, P["inside"]))
            for k, side in enumerate((-1, 1)):
                flap = lpm.box(f"flap{k}", (0.012, width * 0.28, height * 0.7), color=P["canvas_dark"], taper=(1.0, 0.2))
                lpm.rotate(flap, side * 35, "Z")
                parts.append(lpm.move(flap, -length / 2 - 0.05, side * width * 0.3, 0))
        else:
            parts.append(lpm.box("seam", (0.006, 0.012, height * 0.92), at=(-length / 2 - 0.002, 0, 0), color=P["rope"]))
        for k, x in enumerate((-length / 2 - 0.02, length / 2 + 0.02)):
            parts.append(lpm.prism(f"pole{k}", 5, 0.015, height + 0.06, at=(x, 0, 0), color=P["wood"]))
        for k, (x, side) in enumerate(((-length / 2, -1), (-length / 2, 1), (length / 2, -1), (length / 2, 1))):
            parts.append(lpm.prism(f"peg{k}", 4, 0.012, 0.04, at=(x * 1.12, side * (width / 2 + 0.08), 0), color=P["wood"]))
        return parts
    return build


export_all({
    "statue_column": column,
    "statue_head": head,
    "statue_obelisk": obelisk,
    "statue_ring": ring,
    "tent_detailedClosed": tent(False),
    "tent_detailedOpen": tent(True),
}, P, budget=300)
