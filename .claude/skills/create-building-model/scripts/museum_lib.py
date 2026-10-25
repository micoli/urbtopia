"""
museum_lib.py - builders of the landmark museums of Urbix. Run INSIDE Blender through tools/blender/bl.py.
Each builder fills its footprint (1 tile = 1 world unit, Z up, front = -Y) and ends with <id>.blend + <id>.glb.
"""
import math
import random

import bmesh

import building_lib as bl
from building_lib import lpm

MUSEUM_ENTRIES = [
    ("copper", "#b8693f", 0.5, 0.45), ("copper_dark", "#8f4a2e", 0.5, 0.45),
    ("titanium", "#cfc8b4", 0.7, 0.35), ("titanium_dark", "#a9a592", 0.7, 0.4), ("gold", "#dcc98c", 0.7, 0.35),
    ("terracotta", "#a24a32", 0.0, 0.8), ("terracotta_dark", "#7d3626", 0.0, 0.8), ("terracotta_light", "#bd5e40", 0.0, 0.8),
    ("water", "#4f8f9a", 0.0, 0.3), ("glass_dark", "#34465a", 0.0, 0.25), ("stone", "#d9d3c4", 0.0, 0.85),
    ("shell_white", "#f4f6fb", 0.0, 0.5), ("shell_shade", "#d7deec", 0.0, 0.5), ("lawn", "#8fbf73", 0.0, 0.9),
]


def _palette(spec):
    entries = bl.use_palette(bl.STYLES["urbtopia"])
    entries = [(name, hex_, 0.0, 0.7) for name, hex_ in entries] + MUSEUM_ENTRIES
    names = [entry[0] for entry in entries]
    lpm.reset()
    return lpm.Palette(entries), names.index


def convex(name, points, color):
    mesh = bmesh.new()
    for point in points:
        mesh.verts.new(point)
    result = bmesh.ops.convex_hull(mesh, input=mesh.verts[:], use_existing_faces=False)
    discarded = {element for element in result["geom_interior"] + result["geom_unused"] if isinstance(element, bmesh.types.BMVert)}
    bmesh.ops.delete(mesh, geom=list(discarded), context="VERTS")
    bmesh.ops.dissolve_limit(mesh, angle_limit=math.radians(1.0), verts=mesh.verts[:], edges=mesh.edges[:])
    mesh.normal_update()
    bmesh.ops.recalc_face_normals(mesh, faces=mesh.faces[:])
    return lpm._object(name, mesh, color)


def rounded_rect(half_x, half_y, radius, steps=3):
    outline = []
    for corner_x, corner_y, start in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for step in range(steps + 1):
            angle = math.radians(start + 90 * step / steps)
            outline.append((corner_x * (half_x - radius) + radius * math.cos(angle), corner_y * (half_y - radius) + radius * math.sin(angle)))
    return outline


def bush(name, x, y, z, size, color):
    return lpm.lathe(name, [(0.0, 0.0), (size, size * 0.25), (size * 1.05, size * 0.8), (size * 0.5, size * 1.5), (0.0, size * 1.7)], segments=6, at=(x, y, z), color=color)


def build_ordos(spec, out_dir):
    """Copper louvered blob on a stone mound, 5x5: stacked wavy slices, a dark glass opening, a paved plaza."""
    palette, index = _palette(spec)
    copper, copper_dark, stone, slab, glass, lawn = (index(n) for n in ("copper", "copper_dark", "stone", "uslab", "glass_dark", "lawn"))
    parts = [lpm.sweep("plaza", rounded_rect(2.45, 2.45, 0.25), 0.03, color=slab, axis="z")]
    parts.append(lpm.prism("mound", 20, 2.1, 0.3, at=(0.0, -0.4, 0.03), color=stone, radius_top=0.8, rotate=9))
    parts.append(lpm.prism("mound_top", 20, 0.8, 0.04, at=(0.0, -0.4, 0.33), color=slab, rotate=9))
    center_x, center_y, slices, thickness, base = 0.1, 0.45, 15, 0.058, 0.27

    def outline(t, count=24):
        scale = math.sin(math.pi * (0.12 + 0.76 * t)) ** 0.5
        points = []
        for k in range(count):
            angle = 2 * math.pi * k / count
            wobble = 1 + 0.10 * math.cos(2 * angle + 0.8) + 0.06 * math.cos(3 * angle)
            points.append((center_x + 1.75 * scale * wobble * math.cos(angle), center_y + 1.15 * scale * wobble * math.sin(angle)))
        return points

    for number in range(slices):
        t = number / (slices - 1)
        parts.append(lpm.sweep(f"slice_{number}", outline(t), thickness, at=(0, 0, base + 0.1 + number * thickness), color=copper if number % 2 == 0 else copper_dark, axis="z"))
    front = min(outline(3 / (slices - 1)), key=lambda point: point[1])
    parts.append(lpm.box("opening", (0.95, 0.07, 0.15), at=(front[0], front[1] + 0.0, base + 0.1 + 3 * thickness - 0.02), color=glass))
    for number, (x, y) in enumerate(((-2.1, -1.9), (2.0, -1.95), (-2.2, 1.7), (2.15, 1.8))):
        parts.append(bush(f"bush_{number}", x, y, 0.03, 0.09, lawn))
    ob = lpm.finish(spec["id"], parts, palette, budget=5000, center=False)
    return bl.export_model(ob, spec, out_dir)


def build_guggenheim(spec, out_dir):
    """Titanium cluster of curved volumes on a stone podium, 6x5: a long ship, a tower of tilted wings, a glass atrium, a reflecting pool, the river and the spider sculpture."""
    palette, index = _palette(spec)
    ti, ti_dark, gold, stone, slab, glass, water, graphite, lawn = (index(n) for n in ("titanium", "titanium_dark", "gold", "stone", "uslab", "glass_dark", "water", "graphite", "lawn"))
    parts = [lpm.box("promenade", (5.9, 1.0, 0.04), at=(0.0, -2.0, 0.0), color=slab)]
    parts.append(lpm.box("river", (5.9, 0.5, 0.025), at=(0.0, -2.25, 0.0), color=water))
    parts.append(lpm.box("podium", (4.4, 2.6, 0.1), at=(-0.8, 0.5, 0.0), color=stone))
    parts.append(lpm.box("terrace", (1.5, 1.2, 0.1), at=(2.2, 0.0, 0.0), color=stone))
    parts.append(lpm.box("pool", (2.0, 0.8, 0.03), at=(0.9, -1.1, 0.0), color=water))
    parts.append(convex("ship", [(-2.9, 0.0, 0.1), (-2.9, 1.2, 0.1), (0.3, 1.5, 0.1), (0.3, -0.5, 0.1), (-2.7, 0.3, 0.5), (-2.7, 1.0, 0.45), (0.1, 1.1, 0.78), (0.1, -0.2, 0.7), (-1.2, 0.5, 0.62)], ti))
    parts.append(convex("ship_fin", [(-2.4, 0.4, 0.45), (-2.4, 1.2, 0.45), (-0.2, 1.4, 0.7), (-0.2, 0.2, 0.62), (-1.4, 0.8, 0.95)], ti_dark))
    wings = [
        ((0.6, 0.0), (1.4, 0.9), 0.85, ti_dark), ((0.9, 0.6), (1.6, 1.4), 1.15, gold), ((1.5, 0.1), (2.2, 0.8), 0.95, ti),
        ((0.3, 0.9), (1.0, 1.5), 0.7, ti), ((1.2, 0.3), (1.9, 1.1), 1.35, ti_dark),
    ]
    for number, ((x0, y0), (x1, y1), top, color) in enumerate(wings):
        lean = 0.18 * (-1 if number % 2 else 1)
        parts.append(convex(f"wing_{number}", [(x0, y0, 0.1), (x1, y0, 0.1), (x1, y1, 0.1), (x0, y1, 0.1), (x0 + lean, y0 + 0.1, top), (x1 + lean, y0 - 0.1, top - 0.1), (x1 + lean, y1, top + 0.05), (x0 + lean, y1 + 0.05, top - 0.12)], color))
    parts.append(lpm.box("atrium", (0.9, 0.5, 0.62), at=(1.0, -0.25, 0.1), color=glass))
    parts.append(convex("canopy", [(0.2, -0.85, 0.74), (1.9, -0.85, 0.6), (1.9, 0.1, 0.68), (0.2, 0.1, 0.8), (0.2, -0.85, 0.7), (1.9, -0.85, 0.56)], ti_dark))
    parts.append(lpm.prism("canopy_column", 8, 0.07, 0.62, at=(1.4, -0.75, 0.1), color=stone))
    parts.append(lpm.sweep("spider_body", [(-0.05, 0.0), (0.05, 0.0), (0.06, 0.06), (0.0, 0.1), (-0.06, 0.06)], 0.1, at=(-1.2, -1.2, 0.3), color=graphite, axis="y"))
    for number, angle in enumerate(range(0, 360, 45)):
        leg = lpm.box(f"spider_leg_{number}", (0.35, 0.015, 0.015), at=(-1.2 + 0.17, -1.2, 0.34), color=graphite)
        parts.append(lpm.rotate(leg, angle, about=(-1.2, -1.2, 0.0)))
        foot = lpm.box(f"spider_foot_{number}", (0.015, 0.015, 0.3), at=(-1.2 + 0.34 * math.cos(math.radians(angle)), -1.2 + 0.34 * math.sin(math.radians(angle)), 0.04), color=graphite)
        parts.append(foot)
    for number, x in enumerate((-2.6, -1.9, -1.2, -0.5)):
        parts.append(bush(f"tree_{number}", x, -1.6, 0.04, 0.1, lawn))
    ob = lpm.finish(spec["id"], parts, palette, budget=6000, center=False)
    return bl.export_model(ob, spec, out_dir)


def build_niteroi(spec, out_dir):
    """White saucer on a flared stem above a green headland, 4x4, with a glass band and a curved access ramp."""
    palette, index = _palette(spec)
    white, shade, glass, stone, lawn, slab = (index(n) for n in ("shell_white", "shell_shade", "glass_dark", "stone", "lawn", "uslab"))
    parts = [lpm.prism("headland", 20, 1.95, 0.08, at=(0.0, 0.0, 0.0), color=lawn, radius_top=1.8)]
    parts.append(lpm.prism("terrace", 20, 0.95, 0.04, at=(0.0, 0.0, 0.08), color=slab))
    parts.append(lpm.lathe("stem", [(0.0, 0.12), (0.5, 0.12), (0.3, 0.2), (0.24, 0.32), (0.3, 0.4), (0.0, 0.4)], segments=16, at=(0.0, 0.0, 0.0), color=shade))
    parts.append(lpm.lathe("bowl", [(0.0, 0.4), (0.32, 0.4), (0.55, 0.5), (0.9, 0.64), (1.0, 0.7), (0.0, 0.7)], segments=24, color=white))
    parts.append(lpm.prism("glass_band", 24, 1.0, 0.1, at=(0.0, 0.0, 0.7), color=glass, radius_top=1.06))
    parts.append(lpm.lathe("roof", [(0.0, 0.8), (1.0, 0.8), (1.26, 0.86), (1.3, 0.9), (1.2, 0.93), (0.0, 0.93)], segments=24, color=white))
    path = []
    for step in range(15):
        t = step / 14
        angle = math.radians(-160 + 190 * t)
        radius = 1.65 - 0.55 * t
        path.append((radius * math.cos(angle), radius * math.sin(angle) * 0.9 - 0.1, 0.08 + 0.46 * t))
    half = 0.09
    for number in range(len(path) - 1):
        (x0, y0, z0), (x1, y1, z1) = path[number], path[number + 1]
        heading = math.atan2(y1 - y0, x1 - x0)
        nx, ny = -math.sin(heading) * half, math.cos(heading) * half
        parts.append(convex(f"ramp_{number}", [(x0 + nx, y0 + ny, z0), (x0 - nx, y0 - ny, z0), (x1 + nx, y1 + ny, z1), (x1 - nx, y1 - ny, z1), (x0 + nx, y0 + ny, z0 - 0.035), (x0 - nx, y0 - ny, z0 - 0.035), (x1 + nx, y1 + ny, z1 - 0.035), (x1 - nx, y1 - ny, z1 - 0.035)], white))
        outer = 1.0
        parts.append(convex(f"ramp_rail_{number}", [(x0 + nx * outer, y0 + ny * outer, z0), (x1 + nx * outer, y1 + ny * outer, z1), (x0 + nx * outer, y0 + ny * outer, z0 + 0.05), (x1 + nx * outer, y1 + ny * outer, z1 + 0.05), (x0 + nx * 0.8, y0 + ny * 0.8, z0), (x1 + nx * 0.8, y1 + ny * 0.8, z1), (x0 + nx * 0.8, y0 + ny * 0.8, z0 + 0.05), (x1 + nx * 0.8, y1 + ny * 0.8, z1 + 0.05)], shade))
    for number, (x, y) in enumerate(((-1.6, 1.0), (1.5, 1.2), (1.7, -0.6), (-1.0, 1.5), (0.6, -1.6))):
        parts.append(bush(f"tree_{number}", x, y, 0.08, 0.13, lawn))
    ob = lpm.finish(spec["id"], parts, palette, budget=5000, center=False)
    return bl.export_model(ob, spec, out_dir)


def build_mas(spec, out_dir):
    """Stack of terracotta slabs shifted against each other with glass floors between, 3x3, on a quay with two moored boats."""
    palette, index = _palette(spec)
    terracotta, dark, light, glass, stone, water, wood, white, slab = (index(n) for n in ("terracotta", "terracotta_dark", "terracotta_light", "glass_dark", "stone", "water", "uwood", "white", "uslab"))
    rng = random.Random(spec.get("seed", spec["id"]))
    parts = [lpm.box("quay", (2.9, 2.0, 0.05), at=(0.0, 0.0, 0.0), color=slab)]
    parts.append(lpm.box("harbour", (2.9, 0.9, 0.03), at=(0.0, -1.0, 0.0), color=water))
    layers = [(0.0, 0.0, 1.5, 1.15, 0.34), (-0.1, 0.05, 1.45, 1.15, 0.34), (0.15, 0.0, 1.5, 1.1, 0.3), (-0.1, -0.05, 1.4, 1.1, 0.3)]
    z = 0.05
    for number, (shift_x, shift_y, width, depth, height) in enumerate(layers):
        parts.append(lpm.box(f"glass_{number}", (width - 0.28, depth - 0.2, 0.2), at=(shift_x * 0.5, shift_y * 0.5 + 0.1, z), color=glass))
        for fin in range(8):
            fx = shift_x * 0.5 - (width - 0.28) / 2 + (width - 0.28) * fin / 7
            parts.append(lpm.box(f"fin_{number}_{fin}", (0.012, 0.012, 0.2), at=(fx, shift_y * 0.5 + 0.1 - (depth - 0.2) / 2 - 0.006, z), color=white))
        z += 0.2
        parts.append(lpm.box(f"slab_{number}", (width, depth, height), at=(shift_x, shift_y + 0.1, z), color=terracotta))
        for face_y, sign in ((shift_y + 0.1 - depth / 2, -1), (shift_y + 0.1 + depth / 2, 1)):
            for column in range(9):
                for row in range(3):
                    if rng.random() > 0.35:
                        continue
                    cell_w, cell_h = width / 9, height / 3
                    cx = shift_x - width / 2 + cell_w * (column + 0.5)
                    cz = z + cell_h * row
                    points = [(cx - cell_w / 2, face_y + sign * 0.004, cz), (cx + cell_w / 2, face_y + sign * 0.004, cz), (cx + cell_w / 2, face_y + sign * 0.004, cz + cell_h), (cx - cell_w / 2, face_y + sign * 0.004, cz + cell_h)]
                    parts.append(bl._decal(f"tile_{number}_{column}_{row}_{sign}", points if sign < 0 else list(reversed(points)), rng.choice((dark, light))))
        z += height
    parts.append(lpm.box("roof_rail", (1.3, 1.0, 0.04), at=(-0.1, 0.05, z), color=glass))
    for number, (x, length) in enumerate(((0.85, 0.5), (1.1, 0.42))):
        parts.append(convex(f"boat_{number}", [(x - length / 2, -1.05 + 0.08 * number, 0.03), (x + length / 2, -1.05 + 0.08 * number, 0.03), (x - length / 2 + 0.08, -1.17 + 0.08 * number, 0.0), (x + length / 2 - 0.08, -1.17 + 0.08 * number, 0.0), (x - length / 2, -0.95 + 0.08 * number, 0.03), (x + length / 2, -0.95 + 0.08 * number, 0.03), (x + length / 2 + 0.06, -1.05 + 0.08 * number, 0.05)], wood if number == 0 else white))
        parts.append(lpm.box(f"mast_{number}", (0.012, 0.012, 0.28), at=(x, -1.05 + 0.08 * number, 0.03), color=white))
    ob = lpm.finish(spec["id"], parts, palette, budget=4500, center=False)
    return bl.export_model(ob, spec, out_dir)


def build_eye(spec, out_dir):
    """White faceted shell on a waterfront, 5x4: tilted roof planes over a glass front, stepped plaza, and a tall dark billboard tower."""
    palette, index = _palette(spec)
    white, shade, glass, slab, water, graphite, navy, orange, stone = (index(n) for n in ("shell_white", "shell_shade", "glass_dark", "uslab", "water", "graphite", "navy", "tangerine", "stone"))
    parts = [lpm.box("plaza", (4.9, 3.0, 0.04), at=(0.0, 0.2, 0.0), color=slab)]
    parts.append(lpm.box("harbour", (4.9, 0.7, 0.03), at=(0.0, -1.65, 0.0), color=water))
    for number in range(4):
        parts.append(lpm.box(f"step_{number}", (1.3, 0.2, 0.04 * (number + 1)), at=(1.1, -0.9 + 0.2 * number, 0.04), color=stone))
    parts.append(lpm.box("terrace_floor", (3.2, 1.0, 0.04), at=(-0.4, -0.55, 0.04), color=shade))
    parts.append(lpm.box("glass_front", (3.0, 0.9, 0.2), at=(-0.4, -0.5, 0.08), color=glass))
    parts.append(convex("shell", [(-2.2, -0.55, 0.280), (1.0, -0.6, 0.280), (1.4, 1.1, 0.120), (-1.6, 1.2, 0.120), (-1.8, 0.1, 0.765), (-0.3, 0.0, 1.054), (0.9, 0.0, 1.394), (1.3, 0.9, 1.020), (-1.2, 1.0, 0.612)], white))
    parts.append(convex("shell_facet", [(-0.3, -0.6, 0.300), (1.0, -0.6, 0.300), (1.0, 0.5, 0.935), (0.2, 0.2, 1.275), (-0.3, 0.0, 0.850)], shade))
    parts.append(convex("shell_peak", [(0.1, 0.1, 1.020), (1.2, 0.1, 1.190), (1.3, 0.8, 1.020), (0.3, 0.7, 1.224), (0.9, 0.35, 1.530)], white))
    parts.append(convex("shell_ridge", [(-1.9, 0.0, 0.595), (-0.3, -0.1, 0.850), (-0.3, 0.7, 0.935), (-1.6, 0.9, 0.300), (-1.2, 0.4, 0.850)], shade))
    parts.append(lpm.box("tower", (0.5, 0.5, 1.35), at=(1.95, 0.9, 0.04), color=graphite))
    parts.append(lpm.box("tower_cap", (0.9, 0.5, 0.06), at=(1.95, 0.9, 1.39), color=white))
    parts.append(lpm.box("tower_mast", (0.04, 0.04, 0.12), at=(1.95, 0.9, 1.45), color=white))
    parts.append(bl._decal("billboard", [(2.17, 0.64, 0.5), (1.73, 0.64, 0.5), (1.73, 0.64, 1.28), (2.17, 0.64, 1.28)], navy))
    parts.append(bl._decal("billboard_mark", [(2.07, 0.639, 0.8), (1.83, 0.639, 0.8), (1.83, 0.639, 1.05), (2.07, 0.639, 1.05)], orange))
    ob = lpm.finish(spec["id"], parts, palette, budget=4000, center=False)
    return bl.export_model(ob, spec, out_dir)
