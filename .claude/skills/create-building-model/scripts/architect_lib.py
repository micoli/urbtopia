"""
architect_lib.py - builder of the Architect office of Urbix. Run INSIDE Blender through tools/blender/bl.py.
Fills its footprint (1 tile = 1 world unit, Z up, front = -Y) and ends with <id>.blend + <id>.glb.
"""
import math

import building_lib as bl
import museum_lib
from building_lib import lpm

EXTRA_ENTRIES = [("pool", "#43d3cc", 0.0, 0.25), ("trunk", "#8a6a4a", 0.0, 0.9), ("palm", "#5da05a", 0.0, 0.85), ("coping", "#eef1f6", 0.0, 0.6)]


def _palette():
    entries = bl.use_palette(bl.STYLES["urbtopia"])
    entries = [(name, hex_, 0.0, 0.7) for name, hex_ in entries] + museum_lib.MUSEUM_ENTRIES + EXTRA_ENTRIES
    names = [entry[0] for entry in entries]
    lpm.reset()
    return lpm.Palette(entries), names.index


def _place(ob, cx, cy, rx, ry):
    lpm.scale(ob, rx, ry, 1.0)
    return lpm.move(ob, cx, cy, 0.0)


def slab(name, cx, cy, rx, ry, z, thickness, color, dome=0.0, segments=28):
    """A thin elliptic slab with a lens edge; `dome` raises its top into a shallow cap."""
    top = z + thickness
    profile = [(0.0, z), (0.8, z), (1.0, z + thickness * 0.45), (0.94, top)]
    if dome > 0:
        profile += [(0.75, top + dome * 0.55), (0.4, top + dome * 0.9), (0.0, top + dome)]
    else:
        profile += [(0.0, top)]
    return _place(lpm.lathe(name, profile, segments=segments, color=color), cx, cy, rx, ry)


def drum(name, cx, cy, rx, ry, z, height, color, segments=28):
    return _place(lpm.prism(name, segments, 1.0, height, at=(0.0, 0.0, z), color=color), cx, cy, rx, ry)


def pillars(prefix, cx, cy, rx, ry, z, height, color, count=12):
    return [lpm.prism(f"{prefix}_{number}", 6, 0.014, height, at=(cx + rx * math.cos(2 * math.pi * number / count), cy + ry * math.sin(2 * math.pi * number / count), z), color=color) for number in range(count)]


def oculus(name, x, y, z, radius, color):
    return lpm.prism(name, 10, radius, 0.006, at=(x, y, z), color=color)


def palm(prefix, x, y, z, height, trunk, leaf):
    parts = [lpm.prism(f"{prefix}_trunk", 6, 0.022, height, at=(x, y, z), color=trunk, radius_top=0.013)]
    top = z + height
    for number in range(7):
        angle = 360 * number / 7
        frond = museum_lib.convex(f"{prefix}_frond_{number}", [(x, y, top), (x + 0.1, y - 0.035, top + 0.03), (x + 0.1, y + 0.035, top + 0.03), (x + 0.24, y, top - 0.07), (x + 0.1, y, top + 0.045)], leaf)
        parts.append(lpm.rotate(frond, angle, about=(x, y, 0.0)))
    return parts


def carport(prefix, cx, cy, z, roof, post, floor, tyre, body):
    """A flat open roof on four slim posts over a paved bay with a small car."""
    width, depth, height = 1.0, 0.5, 0.2
    parts = [lpm.box(f"{prefix}_bay", (width, depth, 0.008), at=(cx, cy, z), color=floor)]
    for number, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        parts.append(lpm.box(f"{prefix}_post_{number}", (0.025, 0.025, height), at=(cx + sx * (width / 2 - 0.03), cy + sy * (depth / 2 - 0.03), z), color=post))
    for side, sy in enumerate((-1, 1)):
        parts.append(lpm.box(f"{prefix}_beam_{side}", (width + 0.08, 0.045, 0.04), at=(cx, cy + sy * (depth / 2 - 0.03), z + height), color=post))
    slats = 11
    for number in range(slats):
        x = cx - width / 2 - 0.04 + (width + 0.08) * number / (slats - 1)
        parts.append(lpm.box(f"{prefix}_slat_{number}", (0.035, depth + 0.08, 0.025), at=(x, cy, z + height + 0.04), color=roof))
    parts.append(lpm.box(f"{prefix}_car", (0.4, 0.17, 0.05), at=(cx, cy, z + 0.02), color=body))
    parts.append(lpm.box(f"{prefix}_cabin", (0.2, 0.15, 0.05), at=(cx - 0.02, cy, z + 0.07), color=tyre))
    return parts


def build_architect_office(spec, out_dir):
    """Stacked white discs on a garden, 3x3: a wide low disc with a glass band, a second disc and a higher one cantilevered over it, a domed saucer on slim legs, and a front terrace with a turquoise pool, palms and a sign."""
    palette, index = _palette()
    white, shade, glass, stone, lawn, graphite, pool, coping, trunk, leaf = (index(n) for n in ("shell_white", "shell_shade", "glass_dark", "stone", "lawn", "graphite", "pool", "coping", "trunk", "palm"))
    parts = [slab("terrace", -0.1, -0.88, 1.15, 0.58, 0.03, 0.035, stone)]
    parts += carport("carport", 0.3, -0.95, 0.065, index("uwood"), graphite, shade, graphite, index("navy"))

    parts.append(drum("hall_glass", 0.0, 0.1, 1.22, 0.72, 0.065, 0.195, glass))
    parts += pillars("hall_pillar", 0.0, 0.1, 1.22, 0.72, 0.065, 0.195, coping)
    parts.append(slab("hall_roof", 0.0, 0.1, 1.42, 0.86, 0.26, 0.05, white))
    parts.append(oculus("hall_oculus", -0.55, 0.0, 0.312, 0.08, graphite))

    parts.append(drum("saucer_glass", 0.9, -0.1, 0.47, 0.42, 0.3, 0.16, glass))
    parts += pillars("saucer_pillar", 0.9, -0.1, 0.47, 0.42, 0.3, 0.16, coping, 8)
    parts.append(slab("saucer_roof", 0.9, -0.1, 0.58, 0.54, 0.46, 0.05, white, dome=0.07))
    for number, (x, y) in enumerate(((1.25, -0.4), (0.62, -0.46))):
        parts.append(lpm.prism(f"saucer_leg_{number}", 6, 0.025, 0.3, at=(x, y, 0.03), color=shade))

    parts.append(drum("middle_glass", 0.35, 0.55, 0.88, 0.56, 0.31, 0.19, glass))
    parts += pillars("middle_pillar", 0.35, 0.55, 0.88, 0.56, 0.31, 0.19, coping)
    parts.append(slab("middle_roof", 0.35, 0.55, 0.98, 0.64, 0.5, 0.05, white))
    parts.append(oculus("middle_oculus", 0.7, 0.55, 0.552, 0.07, graphite))

    parts.append(drum("tower_glass", -0.1, 0.8, 0.46, 0.36, 0.55, 0.25, glass))
    parts += pillars("tower_pillar", -0.1, 0.8, 0.46, 0.36, 0.55, 0.25, coping, 10)
    parts.append(slab("tower_roof", -0.1, 0.8, 0.76, 0.62, 0.8, 0.05, white))
    parts.append(oculus("tower_oculus", -0.1, 0.8, 0.852, 0.1, graphite))

    parts.append(lpm.box("sign_stele", (0.78, 0.035, 0.12), at=(-0.78, -1.3, 0.065), color=coping))
    parts.append(bl.glyph_decal({"cfg": bl.STYLES["urbtopia"]}, "sign_text", "front", "ARCHITECT", -0.78, 0.095, 0.05, graphite, 1.3 + 0.0175 + 0.004))
    parts += palm("palm_a", -1.0, -0.7, 0.065, 0.34, trunk, leaf)
    ob = lpm.finish(spec["id"], parts, palette, budget=3500, center=False)
    return bl.export_model(ob, spec, out_dir)
