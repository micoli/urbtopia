import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nature_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("bark", "#8a5a34", 0.0, 0.9), ("bark_dark", "#6e4222", 0.0, 0.9),
    ("inner", "#e3c28a", 0.0, 0.9), ("ring", "#c49a5e", 0.0, 0.9), ("hollow", "#4a3020", 0.0, 1.0),
    ("moss", "#7cbf4a", 0.0, 0.9),
])


def log(name, length, radius, at=(0, 0, 0), yaw=0, sides=7):
    """A log lying along +y on the ground, its cut ends showing the light wood and one growth ring."""
    ob = lpm.prism(name, sides, radius, length, color=P["bark"], radius_top=radius * 0.95)
    lpm.paint(ob, P["bark_dark"], lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.5)
    lpm.paint(ob, P["inner"], lambda c, n, i: abs(n.z) > 0.5)
    lpm.move(ob, 0, 0, -length / 2)
    lpm.rotate(ob, -90, "X")
    lpm.move(ob, 0, 0, radius)
    parts = [ob]
    for side in (-1, 1):
        ring = lpm.prism(f"{name}r{side}", sides, radius * 0.45, 0.004, color=P["ring"])
        lpm.rotate(ring, -90 * side, "X")
        lpm.move(ring, 0, side * length / 2, radius)
        parts.append(ring)
    for p in parts:
        lpm.rotate(p, yaw, "Z")
        lpm.move(p, *at)
    return parts


def hollow_log(rng):
    """A big fallen trunk along x, hollowed out, with moss on its back."""
    parts = []
    radius, inner, length, sides = 0.24, 0.15, 1.0, 8
    for k in range(sides):
        a0, a1 = 2 * math.pi * k / sides, 2 * math.pi * (k + 1) / sides
        verts = []
        for x in (-length / 2, length / 2):
            for r, a in ((radius, a0), (radius, a1), (inner, a1), (inner, a0)):
                verts.append((x, r * math.cos(a), radius + r * math.sin(a)))
        faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        seg = lpm._object(f"s{k}", lpm._bm_from(verts, faces), P["bark"])
        lpm.paint(seg, P["inner"], lambda c, n, i: abs(n.x) > 0.5)
        lpm.paint(seg, P["hollow"], lambda c, n, i: abs(n.x) < 0.5 and (c.y * n.y + (c.z - radius) * n.z) < 0)
        lpm.paint(seg, P["moss"], lambda c, n, i: abs(n.x) < 0.5 and n.z > 0.7)
        parts.append(seg)
    branch = lpm.prism("branch", 5, 0.05, 0.22, color=P["bark"], radius_top=0.03)
    lpm.rotate(branch, 40, "X")
    lpm.move(branch, 0.15, 0.15, radius + 0.08)
    return parts + [branch]


def stack(rows):
    def build(rng):
        parts = []
        radius = 0.085
        for level, count in enumerate(rows):
            for k in range(count):
                x = (k - (count - 1) / 2) * radius * 2.05
                parts += log(f"l{level}{k}", 0.7 * rng.uniform(0.92, 1.0), radius, at=(x, rng.uniform(-0.03, 0.03), level * radius * 1.75))
        return parts
    return build


def stump(height, radius, jagged, roots, sides=7):
    def build(rng):
        body = lpm.prism("body", sides, radius, height, color=P["bark"], radius_top=radius * 0.88)
        lpm.paint(body, P["bark_dark"], lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.5)
        lpm.paint(body, P["inner"], lambda c, n, i: n.z > 0.5)
        parts = [body]
        if jagged:
            lpm.paint(body, P["bark"], lambda c, n, i: n.z > 0.5)
            for k in range(5):
                a = 2 * math.pi * k / 5 + rng.uniform(-0.2, 0.2)
                tooth = lpm.prism(f"t{k}", 3, radius * 0.4, rng.uniform(0.05, 0.12), at=(radius * 0.6 * math.cos(a), radius * 0.6 * math.sin(a), height - 0.01),
                                  color=P["bark"], radius_top=0.0, rotate=math.degrees(a))
                lpm.paint(tooth, P["inner"], lambda c, n, i: c.x * n.x + c.y * n.y < 0)
                parts.append(tooth)
        else:
            parts.append(lpm.prism("ring", sides, radius * 0.5, 0.004, at=(0, 0, height), color=P["ring"]))
        for k in range(roots):
            a = 360 * k / roots + rng.uniform(-15, 15)
            root = lpm.prism(f"root{k}", 4, 0.04, radius * 0.9, color=P["bark_dark"], radius_top=0.0)
            lpm.rotate(root, 75, "Y")
            lpm.rotate(root, a, "Z")
            lpm.move(root, radius * 0.7 * math.cos(math.radians(a)), radius * 0.7 * math.sin(math.radians(a)), 0.02)
            parts.append(root)
        return parts
    return build


export_all({
    "log": lambda rng: log("log", 0.7, 0.085),
    "log_large": hollow_log,
    "log_stack": stack((2, 1)),
    "log_stackLarge": stack((3, 2, 1)),
    "stump_old": stump(0.2, 0.15, True, 4),
    "stump_oldTall": stump(0.55, 0.14, True, 4),
    "stump_round": stump(0.17, 0.15, False, 0),
    "stump_square": stump(0.25, 0.17, False, 0, sides=4),
}, P, budget=500)
