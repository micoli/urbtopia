"""Lays every Restaurant model out on one board in the open Blender, for a single validation pass.

Run in the live Blender: exec(open("<path>/board.py").read()). It empties the scene (never a factory reset), imports the .glb files
and adds English labels. Rebuild after editing a recipe: run restaurant.py headless, then this script again."""
import math
import os

import bpy
from mathutils import Euler, Vector

MODELS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if "__file__" in globals() else "/Users/omichaud/src/urbtopia/assets/managed-models"
PUBLIC = os.path.join(os.path.dirname(os.path.dirname(MODELS)), "public", "models")
RESTAURANT = os.path.join(MODELS, "restaurant")
BUILDINGS = os.path.join(MODELS, "buildings")

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
        for modifier in list(o.modifiers):
            o.modifiers.remove(modifier)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mesh = meshes[0]
    mesh.hide_viewport = True
    mesh.hide_render = True
    _cache[path] = mesh
    return mesh


def place(path, x, y, rot=0.0, name=None, scale=1.0):
    source = load(path)
    ob = source.copy()
    ob.hide_viewport = False
    ob.hide_render = False
    bpy.context.collection.objects.link(ob)
    ob.location = (x, y, 0)
    ob.rotation_euler = Euler((0, 0, math.radians(rot)))
    ob.scale = (scale, scale, scale)
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
    node = next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    node.inputs["Base Color"].default_value = color
    ob.data.materials.append(material)
    return ob


def flat_box(name, x0, x1, y0, y1, z, color):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], [], [(0, 1, 2, 3)])
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = color
    mesh.materials.append(material)
    return ob


def r(name):
    return os.path.join(RESTAURANT, name, name + ".glb")


def b(name):
    return os.path.join(BUILDINGS, name, name + ".glb")


flat_box("board", -2.5, 15.5, -2.4, 25.5, -0.03, (0.78, 0.8, 0.84, 1))

PITCH = 1.7
# Row 1: Fixtures
y = 0.0
label("RESTAURANT BOARD  -  validate or change anything in one pass", 6.5, y - 1.6, 0.3)
label("KITCHEN", 0.85, y + 1.3, 0.22, (0.7, 0.2, 0.15, 1))
label("DINING ROOM", 8.5, y + 1.3, 0.22, (0.7, 0.2, 0.15, 1))
fixtures = [("cooktop", "Cooktop", r("cooktop")), ("prep-table", "Prep table", r("prep-table")), ("table", "Table", r("table")), ("chair", "Chair (offset)", r("chair")),
            ("stool", "Bar stool (offset)", r("stool")), ("bar", "Bar", r("bar")), ("register", "Checkout (reused)", os.path.join(PUBLIC, "mini-market", "cash-register.glb")),
            ("armchair", "Waiting armchair", r("waiting-armchair"))]
for k, (name, text, path) in enumerate(fixtures):
    x = k * PITCH
    place(path, x, y, name=name)
    label(text, x, y - 0.75, 0.13)

# Row 2: walls
y = 4.6
label("WALLS  (no horizontal band, green plinth kept)", 6.5, y + 1.5, 0.22, (0.7, 0.2, 0.15, 1))
walls = [("Supermarket wall (ref)", os.path.join(PUBLIC, "mini-market", "wall.glb")), ("Wall", r("wall")), ("Window wall", r("wall-window")), ("Corner", r("wall-corner"))]
for k, (text, path) in enumerate(walls):
    x = k * 1.35
    place(path, x, y)
    label(text, x, y - 0.75, 0.11)

# Row 3: staff
y = 8.8
label("STAFF  (5 roles)", 6.5, y + 1.3, 0.22, (0.7, 0.2, 0.15, 1))
staff = [("Cook", "character-cook"), ("Kitchen assistant", "character-kitchen-assistant"), ("Maitre d'", "character-maitre-d"), ("Waiter", "character-waiter"), ("Bartender", "character-bartender")]
for k, (text, name) in enumerate(staff):
    x = k * PITCH
    place(r(name), x, y, scale=1.0)
    label(text, x, y - 0.75, 0.13)
for k, (text, name) in enumerate((("Ref: customer (male)", "character-male-a"), ("Ref: customer (female)", "character-female-a"))):
    x = (5 + k) * PITCH + 0.6
    place(os.path.join(MODELS, "mini-characters", name, name + ".glb"), x, y)
    label(text, x, y - 0.75, 0.11)

# Row 4: assembled sets and a small interior mock-up
y = 13.4
label("ASSEMBLY CHECKS", 2.0, y + 1.6, 0.22, (0.7, 0.2, 0.15, 1))
cx = 0.0
place(r("table"), cx, y, name="set table")
for rot, dx, dy in ((0, 0, 1), (180, 0, -1), (90, 1, 0), (-90, -1, 0)):
    place(r("chair"), cx + dx, y + dy, rot, name="set chair")
label("Table + 4 chairs", cx, y - 1.75, 0.13)
bx = 4.0
place(r("bar"), bx, y, 0, name="set bar")
for dx in (-1, 0, 1):
    place(r("stool"), bx + dx, y - 1, 180, name="set stool")
label("Bar + 3 stools", bx, y - 1.75, 0.13)

# Mock-up interior: 8 x 5 floor, kitchen left, dining right, partition with an opening
mx, my = 6.5, 11.4
for i in range(8):
    for j in range(5):
        shade = 0.88 if (i + j) % 2 == 0 else 0.76
        flat_box("floor", mx + i - 0.5, mx + i + 0.5, my + j - 0.5, my + j + 0.5, 0.0, (shade, shade, shade + 0.03, 1))
W, WIN, CORNER = r("wall"), r("wall-window"), r("wall-corner")
for i in range(8):
    place(WIN if i in (3, 6) else W, mx + i, my + 4.5 + 0.0, 180, name="back wall")
for j in range(5):
    place(W, mx - 0.5, my + j, 90 if True else 0, name="side wall")
place(CORNER, mx - 0.5, my + 4.5, 180, name="corner")
for j in (0, 1, 3):
    place(W, mx + 2.5, my + j + 0.0, 90, name="partition")
place(r("cooktop"), mx + 0.0, my + 3.5, 180)
place(r("cooktop"), mx + 1.0, my + 3.5, 180)
place(r("prep-table"), mx + 1.0, my + 1.0, 0)
place(r("character-cook"), mx + 0.0, my + 2.6, 0)
place(r("character-kitchen-assistant"), mx + 1.0, my + 1.8, 0)
place(r("character-waiter"), mx + 3.2, my + 2.0, 0)
place(r("table"), mx + 4.0, my + 2.0)
for rot, dx, dy in ((0, 0, 1), (180, 0, -1)):
    place(r("chair"), mx + 4.0 + dx, my + 2.0 + dy, rot)
place(r("table"), mx + 6.0, my + 2.0)
for rot, dx, dy in ((0, 0, 1), (180, 0, -1), (90, 1, 0), (-90, -1, 0)):
    place(r("chair"), mx + 6.0 + dx, my + 2.0 + dy, rot)
place(r("bar"), mx + 4.0, my + 4.0, 0)
place(r("bar"), mx + 5.0, my + 4.0, 0)
place(r("stool"), mx + 4.0, my + 3.0, 180)
place(r("stool"), mx + 5.0, my + 3.0, 180)
place(os.path.join(PUBLIC, "mini-market", "cash-register.glb"), mx + 3.0, my + 0.0, 0)
place(r("character-maitre-d"), mx + 3.2, my + 0.0, 0)
place(r("waiting-armchair"), mx + 5.0, my + 0.0, 0)
place(r("waiting-armchair"), mx + 6.0, my + 0.0, 0)
place(r("character-bartender"), mx + 4.5, my + 4.5, 0)
label("Interior mock-up: kitchen | partition | dining room", mx + 3.5, my - 1.0, 0.15)

# Row 5: exteriors
y = 21.0
label("EXTERIORS  (T1 3x2, T2 3x3, T3 3x3 two floors)", 6.5, y + 2.6, 0.22, (0.7, 0.2, 0.15, 1))
for k, (text, name) in enumerate((("Tier 1", "restaurant-3x2-t1-tone-a"), ("Tier 2", "restaurant-3x3-t2-tone-a"), ("Tier 3", "restaurant-3x3-t3-tone-a"))):
    x = 1.5 + k * 5.0
    place(b(name), x, y)
    label(text, x, y - 2.3, 0.18)

for window in bpy.context.window_manager.windows:
    for area in window.screen.areas:
        if area.type != "VIEW_3D":
            continue
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.shading.type = "MATERIAL"
                space.region_3d.view_perspective = "ORTHO"
                space.region_3d.view_rotation = Euler((math.radians(52), 0, math.radians(8))).to_quaternion()
        with bpy.context.temp_override(window=window, area=area, region=next(rg for rg in area.regions if rg.type == "WINDOW")):
            bpy.ops.view3d.view_all()
print("board ready:", len([o for o in bpy.data.objects if not o.hide_viewport]), "objects")
