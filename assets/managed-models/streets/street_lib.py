"""Low-poly road kit: flat polygons painted with cells of the road colormap (Textures/, made by make_textures.py); the BRT and pedestrian variants swap that texture.

Frame: Blender, Z up, one tile is 1 unit, N is +Y, E is +X. Exports <out>/<name>.glb and <name>.blend.
"""
import math
import os
import sys

import bmesh
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
COLORMAP = os.path.join(HERE, "Textures", "colormap.png")
CELLS = {"gutter": (8, 8), "road": (24, 8), "line": (40, 8), "curb": (56, 8), "side": (8, 24)}
Z_CURB, Z_FLAT = 0.02, 0.01
CURB, GUTTER, HALF_ROAD = 0.1, 0.1, 0.3
LINE = 0.01
SLAB = 0.025
DECK = 2 * SLAB
SIZE = 64


class Kit:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.verts = {}
        self.paint = self.bm.faces.layers.int.new("cell")

    def vert(self, x, y, z):
        key = (round(x, 5), round(y, 5), round(z, 5))
        if key not in self.verts:
            self.verts[key] = self.bm.verts.new((x, y, z))
        return self.verts[key]

    def poly(self, points, cell, facing=(0, 0, 1)):
        """Add a polygon, wound so its normal faces `facing`."""
        verts = [self.vert(*p) for p in points]
        if len(set(map(id, verts))) < 3:
            return
        normal = [0.0, 0.0, 0.0]
        for (ax, ay, az), (bx, by, bz) in zip(points, points[1:] + points[:1]):
            normal[0] += (ay - by) * (az + bz)
            normal[1] += (az - bz) * (ax + bx)
            normal[2] += (ax - bx) * (ay + by)
        if sum(n * f for n, f in zip(normal, facing)) < 0:
            verts.reverse()
        try:
            face = self.bm.faces.new(verts)
        except ValueError:
            return
        face[self.paint] = list(CELLS).index(cell)
        u, v = CELLS[cell]
        for loop in face.loops:
            loop[self.uv].uv = (u / SIZE, 1 - v / SIZE)

    def rect(self, x0, y0, x1, y1, z, cell):
        self.poly([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], cell)

    def strip(self, a, b, z, cell, facing=(0, 0, 1)):
        """Quads between two polylines with the same number of points (z may be a function of the point)."""
        for i in range(len(a) - 1):
            self.poly([a[i], a[i + 1], b[i + 1], b[i]], cell, facing)

    def skirt(self, depth=SLAB, border=0.5):
        """Close the rim of the upward faces with walls down to `depth` below the road surface, the same under the curb as under the road.

        No wall where the tile joins its neighbour: on the border, across a road or gutter or the end of a curb band."""
        self.bm.normal_update()
        rim = []
        for edge in self.bm.edges:
            if len(edge.link_faces) != 1 or edge.link_faces[0].normal.z < 0.5:
                continue
            face = edge.link_faces[0]
            a, b = edge.verts
            joins = any(abs(abs(a.co[axis]) - border) < 1e-6 and abs(abs(b.co[axis]) - border) < 1e-6 for axis in (0, 1))
            if joins and (list(CELLS)[face[self.paint]] != "curb" or edge.calc_length() <= CURB + 1e-6):
                continue
            mid = (a.co + b.co) / 2
            outward = (mid.x - face.calc_center_median().x, mid.y - face.calc_center_median().y, 0)
            rim.append((a.co.copy(), b.co.copy(), outward, list(CELLS)[face[self.paint]] == "curb"))
        runs = {}
        relief = Z_CURB - Z_FLAT
        for a, b, outward, curb in rim:
            drop = depth + (relief if curb else 0)
            axis = 0 if abs(a.y - b.y) < 1e-9 else 1 if abs(a.x - b.x) < 1e-9 else None
            if axis is None or abs(a.z - b.z) > 1e-9:
                floor_a, floor_b = a.z - drop, b.z - drop
                self.poly([(a.x, a.y, floor_a), (b.x, b.y, floor_b), (b.x, b.y, b.z), (a.x, a.y, a.z)], "side", outward)
                continue
            other = 1 - axis
            key = (axis, round(a[other], 5), round(a.z, 5), outward[other] > 0, drop)
            runs.setdefault(key, []).append(sorted((a[axis], b[axis])))
        for (axis, at, z, positive, drop), spans in runs.items():
            spans.sort()
            merged = [spans[0]]
            for start, end in spans[1:]:
                if start <= merged[-1][1] + 1e-6:
                    merged[-1][1] = max(merged[-1][1], end)
                else:
                    merged.append([start, end])
            for start, end in merged:
                point = (lambda t: (t, at)) if axis == 0 else (lambda t: (at, t))
                (x0, y0), (x1, y1) = point(start), point(end)
                facing = [0, 0, 0]
                facing[1 - axis] = 1 if positive else -1
                floor = z - drop
                self.poly([(x0, y0, floor), (x1, y1, floor), (x1, y1, z), (x0, y0, z)], "side", tuple(facing))

    def finish(self, out_dir=None):
        out_dir = out_dir or os.path.join(HERE, self.name)
        os.makedirs(out_dir, exist_ok=True)
        bpy.ops.wm.read_factory_settings(use_empty=True)
        mesh = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(mesh)
        for polygon in mesh.polygons:
            polygon.use_smooth = False
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        image = bpy.data.images.load(COLORMAP)
        image.pack()
        material = bpy.data.materials.new("colormap")
        material.use_nodes = True
        tree = material.node_tree
        bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
        texture = tree.nodes.new("ShaderNodeTexImage")
        texture.image = image
        tree.links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 1.0
        mesh.materials.append(material)
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        stem = os.path.join(out_dir, self.name)
        bpy.ops.export_scene.gltf(filepath=stem + ".glb", export_format="GLB", use_selection=True)
        bpy.ops.wm.save_as_mainfile(filepath=stem + ".blend")
        print(f"{self.name}: {sum(len(p.vertices) - 2 for p in mesh.polygons)} triangles")


def recipe_out():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return argv[argv.index("--out") + 1] if "--out" in argv else None


def subtract(rect, cut):
    """rect minus cut, both (x0, y0, x1, y1), as up to four rects."""
    x0, y0, x1, y1 = rect
    cx0, cy0, cx1, cy1 = max(cut[0], x0), max(cut[1], y0), min(cut[2], x1), min(cut[3], y1)
    if cx0 >= cx1 or cy0 >= cy1:
        return [rect]
    pieces = [(x0, y0, cx0, y1), (cx1, y0, x1, y1), (cx0, y0, cx1, cy0), (cx0, cy1, cx1, y1)]
    return [p for p in pieces if p[2] - p[0] > 1e-9 and p[3] - p[1] > 1e-9]


def flat_tile(kit, open_sides, lines=(), bars=()):
    """A square tile on a 3x3 grid of curb, gutter and road bands; `lines` and `bars` are rects painted over the road."""
    edges = [-0.5, -0.4, -0.3, 0.3, 0.4, 0.5]
    cuts = [*lines, *bars]
    for i in range(5):
        for j in range(5):
            x0, x1, y0, y1 = edges[i], edges[i + 1], edges[j], edges[j + 1]
            if i == 2 and j == 2:
                continue
            kind = region(i, j, open_sides)
            if kind == "road":
                continue
            z = Z_CURB if kind == "curb" else Z_FLAT
            kit.rect(x0, y0, x1, y1, z, kind)
    road = [(-0.3, -0.3, 0.3, 0.3)]
    if "W" in open_sides:
        road.append((-0.5, -0.3, -0.3, 0.3))
    if "E" in open_sides:
        road.append((0.3, -0.3, 0.5, 0.3))
    if "S" in open_sides:
        road.append((-0.3, -0.5, 0.3, -0.3))
    if "N" in open_sides:
        road.append((-0.3, 0.3, 0.3, 0.5))
    for rect in road:
        pieces = [rect]
        for cut in cuts:
            pieces = [p for r in pieces for p in subtract(r, cut)]
        for p in pieces:
            kit.rect(*p, Z_FLAT, "road")
    for cut in cuts:
        kit.rect(*cut, Z_FLAT, "line")
    kit.skirt()


def region(i, j, open_sides):
    """Material of cell (i, j) of the 5x5 grid: 0-1 outer curb and gutter on the low side, 2 road, 3-4 gutter and curb on the high side."""
    def band(k):
        return "road" if k == 2 else ("gutter" if k in (1, 3) else "curb")

    bx, by = band(i), band(j)
    if bx == "road" and by == "road":
        return "road"
    if bx == "road":
        side = "N" if j > 2 else "S"
        return "road" if side in open_sides else by
    if by == "road":
        side = "E" if i > 2 else "W"
        return "road" if side in open_sides else bx
    x_open = ("E" if i > 2 else "W") in open_sides
    y_open = ("N" if j > 2 else "S") in open_sides
    if x_open and y_open:
        return "curb" if bx == "curb" and by == "curb" else "gutter"
    if x_open:
        return by
    if y_open:
        return bx
    return "curb" if "curb" in (bx, by) else "gutter"


def arc(cx, cy, radius, a0, a1, steps, z):
    return [(cx + radius * math.cos(math.radians(a0 + (a1 - a0) * k / steps)), cy + radius * math.sin(math.radians(a0 + (a1 - a0) * k / steps)), z) for k in range(steps + 1)]


def box(kit, x0, y0, z0, x1, y1, z1, cell):
    for facing, quad in (
        ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]),
        ((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]),
        ((-1, 0, 0), [(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)]),
        ((0, 1, 0), [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)]),
        ((0, -1, 0), [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)]),
    ):
        kit.poly(quad, cell, facing)


# Cross-section of a straight road, from the low side to the high side: (from, to, cell, height).
SECTION = [
    (-0.5, -0.4, "curb", Z_CURB),
    (-0.4, -0.3, "gutter", Z_FLAT),
    (-0.3, -LINE, "road", Z_FLAT),
    (-LINE, LINE, "line", Z_FLAT),
    (LINE, 0.3, "road", Z_FLAT),
    (0.3, 0.4, "gutter", Z_FLAT),
    (0.4, 0.5, "curb", Z_CURB),
]


def smoothstep(t):
    return t * t * (3 - 2 * t)


def roundabout(kit, arms="ENWS"):
    """Roundabout over 3x3 tiles: a ring road around an open island and a one-tile arm at the middle of each side in `arms`."""
    arc_steps, island_steps, edge = 4, 4, 1.5
    levels = [(1.3, 0.5, Z_CURB), (1.2, 0.4, Z_FLAT), (1.1, 0.3, Z_FLAT)]
    window = math.degrees(math.asin(0.3 / 1.1))
    open_arm = ["ENWS"[i] in arms for i in range(4)]

    def turn(point, quarter):
        x, y, z = point
        for _ in range(quarter):
            x, y = -y, x
        return (x, y, z)

    def reach(radius, half, quarter):
        """Angles where the ring boundary of a quadrant starts and ends: at the axis, or at the side of an open arm."""
        a = math.degrees(math.asin(half / radius))
        return (a if open_arm[quarter] else 0, 90 - (a if open_arm[(quarter + 1) % 4] else 0))

    def circle(radius, angles, z):
        return [(radius * math.cos(math.radians(a)), radius * math.sin(math.radians(a)), z) for a in angles]

    def outline(radius, half, z, quarter):
        start, end = reach(radius, half, quarter)
        ring = arc(0, 0, radius, start, end, arc_steps, z)
        return [*([(edge, half, z)] if open_arm[quarter] else []), *ring, *([(half, edge, z)] if open_arm[(quarter + 1) % 4] else [])]

    def ring_angles(quarter):
        start, end = reach(1.1, 0.3, quarter)
        return [90 * quarter + start + (end - start) * k / arc_steps for k in range(arc_steps + 1)]

    arcs = [ring_angles(q) for q in range(4)]
    around = []
    for angle in (a for quarter in arcs for a in quarter):
        if not around or abs(angle - around[-1]) > 1e-6:
            around.append(angle)
    if abs(around[-1] - 360 - around[0]) < 1e-6:
        around.pop()
    for inner, outer, cell, z in [(0.3, 0.4, "curb", Z_CURB), (0.4, 0.5, "gutter", Z_FLAT)]:
        a, b = circle(inner, around, z), circle(outer, around, z)
        kit.strip([*a, a[0]], [*b, b[0]], z, cell)
    for quarter in range(4):
        bands = [[turn(p, quarter) for p in outline(radius, half, z, quarter)] for radius, half, z in levels]
        kit.strip(bands[0], bands[1], Z_CURB, "curb")
        kit.strip(bands[1], bands[2], Z_FLAT, "gutter")
        kit.strip(circle(0.5, arcs[quarter], Z_FLAT), circle(1.1, arcs[quarter], Z_FLAT), Z_FLAT, "road")
        following = (quarter + 1) % 4
        if not open_arm[following]:
            continue
        gap = [arcs[quarter][-1], arcs[following][0] + (360 if following == 0 else 0)]
        inner, outer = circle(0.5, gap, Z_FLAT), circle(1.1, gap, Z_FLAT)
        kit.poly([inner[0], outer[0], turn((edge, -0.3, Z_FLAT), quarter + 1), turn((edge, 0.3, Z_FLAT), quarter + 1), outer[1], inner[1]], "road")
    kit.skirt(border=edge)
