"""Lays out the walls of every Venue in the open Blender: the pieces of each kit and a sample room where partitions join.

Run in the live Blender: exec(open("<path>/walls_board.py").read()). It empties the scene (never a factory reset) and imports the
generated .glb files of public/models, so run `npm run assets` after changing a recipe. The join rules repeat
src/core/venues/partitions.ts."""
import math
import os

import bpy
from mathutils import Euler

ROOT = "/Users/omichaud/src/urbtopia"
PUBLIC = os.path.join(ROOT, "public", "models")

KITS = [
    ("RESTAURANT", "restaurant", dict(floor="floor", wall="wall", corner="wall-corner", straight="partition", window="wall-window", elbow="partition-elbow", tee="partition-tee", cross="partition-cross")),
    ("SUPERMARKET", "mini-market", dict(floor="floor", wall="wall", corner="wall-corner", straight="partition", window="wall-window", elbow="partition-elbow", tee="partition-tee", cross="partition-cross")),
    ("ARCADE", "mini-arcade", dict(floor="floor", wall="wall", corner="wall-corner", straight="partition", window="wall-window", elbow="partition-elbow", tee="partition-tee", cross="partition-cross")),
    ("HOTEL", "furniture", dict(floor=None, wall=None, corner=None, straight="partition", window="partitionWindow", elbow="partitionElbow", tee="partitionTee", cross="partitionCross")),
]

for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.curves):
    for item in list(block):
        if item.users == 0:
            block.remove(item)

_cache = {}


def load(path):
    if path in _cache:
        return _cache[path]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mesh = meshes[0]
    mesh.hide_viewport = True
    mesh.hide_render = True
    _cache[path] = mesh
    return mesh


def place(path, x, y, turns=0, name=None):
    ob = load(path).copy()
    ob.hide_viewport = False
    ob.hide_render = False
    bpy.context.collection.objects.link(ob)
    ob.location = (x, y, 0)
    ob.rotation_euler = Euler((0, 0, math.radians(90 * turns)))
    ob.name = name or os.path.basename(path)[:-4]
    return ob


def label(text, x, y, size=0.17, color=(0.1, 0.1, 0.12, 1)):
    curve = bpy.data.curves.new(text, "FONT")
    curve.body = text
    curve.size = size
    curve.align_x = "CENTER"
    ob = bpy.data.objects.new("label " + text, curve)
    ob.location = (x, y, 0.002)
    bpy.context.collection.objects.link(ob)
    material = bpy.data.materials.new("label")
    material.use_nodes = True
    next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = color
    ob.data.materials.append(material)


def flat_box(name, x0, x1, y0, y1, z, color):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], [], [(0, 1, 2, 3)])
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = color
    mesh.materials.append(material)


# Sample room, cells (x, y) with y going down the screen as in the game: a run with a window, a column crossing it, a T, an elbow, two lone walls.
W, H = 9, 7
WALLS = {(x, 3) for x in range(1, 8)} | {(3, y) for y in range(1, 6)} | {(6, 1), (7, 1), (6, 2)} | {(1, 5), (8, 5)}
WINDOWS = {(5, 3)}
LONE_ROTATION = {(1, 5): 0, (8, 5): 1}
SIDES = [("E", 1, 0), ("S", 0, 1), ("W", -1, 0), ("N", 0, -1)]
OPPOSITE = {"E": "W", "W": "E", "S": "N", "N": "S"}
ELBOW = {"ES": 0, "EN": 1, "NW": 2, "SW": 3}
TEE = {"N": 0, "W": 1, "S": 2, "E": 3}


def piece_of(cell):
    arms = []
    for side, dx, dy in SIDES:
        other = (cell[0] + dx, cell[1] + dy)
        if other not in WALLS:
            continue
        if other in WINDOWS and OPPOSITE[side] not in "EW":
            continue
        arms.append(side)
    along_x = "E" in arms or "W" in arms
    along_y = "N" in arms or "S" in arms
    if not arms:
        return "straight", LONE_ROTATION.get(cell, 0) % 2
    if len(arms) == 4:
        return "cross", 0
    if len(arms) == 3:
        return "tee", TEE[next(s for s, _, _ in SIDES if s not in arms)]
    if along_x and along_y:
        return "elbow", ELBOW["".join(sorted(arms, key="ESWN".index))]
    return "straight", 0 if along_x else 1


def tile_center(ox, oy, x, y):
    return ox + x + 0.5, oy - (y + 0.5)


flat = (0.78, 0.8, 0.84, 1)
board_w = 20
section = 11.5
flat_box("board", -2.5, board_w, -(section * len(KITS)) + 2.5, 3.0, -0.05, flat)

for index, (title, kit, names) in enumerate(KITS):
    oy = -index * section
    path = lambda key: os.path.join(PUBLIC, kit, names[key] + ".glb")
    label(title, 7.5, oy + 1.2, 0.3, (0.7, 0.2, 0.15, 1))

    # Catalogue of the kit, in a row
    catalogue = [("straight", "Wall"), ("window", "Window"), ("elbow", "Elbow"), ("tee", "T"), ("cross", "Cross")]
    if names["corner"]:
        catalogue.append(("corner", "Corner post"))
    for k, (key, text) in enumerate(catalogue):
        x = -1.0 + k * 1.5
        place(path(key), x, oy - 0.2, 0, name=f"{kit} {key}")
        label(text, x, oy - 0.9, 0.12)

    # Sample room
    ox, ry = 0.5, oy - 2.0
    if names["floor"]:
        for x in range(W):
            for y in range(H):
                place(path("floor"), *tile_center(ox, ry, x, y), 0, name=f"{kit} floor")
        for i in range(W):
            if i != 1:
                place(path("wall"), ox + i + 0.5, ry, 0, name=f"{kit} shell wall")
        for j in range(H):
            place(path("wall"), ox, ry - (j + 0.5), 1, name=f"{kit} shell wall")
        place(path("corner"), ox, ry, 0, name=f"{kit} corner")
    else:
        for x in range(W):
            for y in range(H):
                shade = 0.88 if (x + y) % 2 == 0 else 0.76
                cx, cy = tile_center(ox, ry, x, y)
                flat_box("floor", cx - 0.5, cx + 0.5, cy - 0.5, cy + 0.5, 0.0, (shade, shade * 0.95, shade * 0.85, 1))
    for cell in sorted(WALLS):
        cx, cy = tile_center(ox, ry, *cell)
        if cell in WINDOWS:
            place(path("window"), cx, cy, 0, name=f"{kit} window")
            continue
        shape, turns = piece_of(cell)
        place(path("straight" if shape == "straight" else shape), cx, cy, turns, name=f"{kit} {shape}")
    label("sample room: run + window, crossing column, T, elbow, two lone walls" + ("" if names["floor"] else "  (hotel perimeter not shown)"), ox + W / 2, ry - H - 0.8, 0.15)

for window in bpy.context.window_manager.windows:
    for area in window.screen.areas:
        if area.type != "VIEW_3D":
            continue
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                space.region_3d.view_perspective = "ORTHO"
                space.region_3d.view_rotation = Euler((math.radians(52), 0, math.radians(0))).to_quaternion()
        with bpy.context.temp_override(window=window, area=area, region=next(rg for rg in area.regions if rg.type == "WINDOW")):
            bpy.ops.view3d.view_all()
print("walls board ready:", len([o for o in bpy.data.objects if not o.hide_viewport]), "objects")
