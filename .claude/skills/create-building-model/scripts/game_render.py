"""
game_render.py - run INSIDE Blender (via bl.py). Control render of a building glb seen like in the game:
orthographic camera at the game's isometric angle, and an approximation of the game's lights
(src/scene/GameScene.ts: warm sun, sky/ground hemisphere, neutral tone mapping, sky-blue background).

  bl.py --script game_render.py -- --input <file.glb|.blend>[,<more.glb>...] --out <dir> [--size 768] [--yaws 45,135,225,315]

Several comma-separated glb files are laid in a grid of three columns in one scene, to compare buildings under the same light.
Writes <dir>/<id>-game-<yaw>.png per yaw and <dir>/<id>-game-sheet.png. Blender's light model is not
three.js's: the render checks palette and silhouette under that light, not exact pixel values.
"""
import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

ISO_PITCH_DEG = math.degrees(math.atan(1 / math.sqrt(2)))
BACKGROUND = (0x9E / 255, 0xC5 / 255, 0xE8 / 255)
SUN_COLOR = (1.0, 0xF2 / 255, 0xD6 / 255)
SUN_DIRECTION = Vector((20.0, 40.0, 10.0))  # three.js x, y (up), z
SKY_COLOR = (0xBC / 255, 0xD8 / 255, 0xF5 / 255)
GROUND_COLOR = (0x8A / 255, 0x7A / 255, 0x64 / 255)
COLUMNS = 3
CELL = 2.8  # spacing of the grid when several buildings are rendered together
GROUND_TILE_COLOR = (0x6C / 255, 0x91 / 255, 0x56 / 255)


def parse():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="game_render")
    p.add_argument("--input", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--size", type=int, default=768)
    p.add_argument("--yaws", default="45,135,225,315", help="game camera yaws in degrees, 45 is the default one")
    p.add_argument("--margin", type=float, default=1.35)
    p.add_argument("--columns", type=int, default=COLUMNS, help="buildings per row in a multi-building render")
    p.add_argument("--cell", type=float, default=CELL, help="spacing between buildings in a multi-building render")
    return p.parse_args(argv)


def load(paths):
    first = paths[0]
    if os.path.splitext(first)[1].lower() == ".blend":
        bpy.ops.wm.open_mainfile(filepath=first)
        return
    bpy.ops.wm.read_factory_settings(use_empty=True)
    columns, cell = COLUMNS, CELL
    for index, path in enumerate(paths):
        if os.path.splitext(path)[1].lower() not in (".glb", ".gltf"):
            raise SystemExit(f"unsupported input: {path}")
        before = set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        added = [ob for ob in bpy.context.scene.objects if ob not in before and ob.type == "MESH"]
        low, high = bounds(added)
        target = Vector((index % columns * cell, -(index // columns) * cell, 0.0))
        offset = target - Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, 0.0))
        for ob in bpy.context.scene.objects:
            if ob not in before and ob.parent is None:
                ob.location += offset
        bpy.context.view_layer.update()


def meshes():
    return [ob for ob in bpy.context.scene.objects if ob.type == "MESH"]


def bounds(objects):
    corners = [ob.matrix_world @ Vector(c) for ob in objects for c in ob.bound_box]
    low = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    high = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    return low, high


def setup_world():
    scene = bpy.context.scene
    world = bpy.data.worlds.new("game")
    world.use_nodes = True
    nodes = world.node_tree.nodes
    background = next(n for n in nodes if n.type == "BACKGROUND")
    background.inputs["Color"].default_value = (*SKY_COLOR, 1.0)
    background.inputs["Strength"].default_value = 0.5
    scene.world = world
    scene.view_settings.view_transform = "Khronos PBR Neutral" if "Khronos PBR Neutral" in [
        i.identifier for i in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items
    ] else "Standard"
    scene.view_settings.exposure = math.log2(0.9)


def add_sun():
    # three.js is Y up: x -> x, y -> z, z -> -y
    direction = Vector((SUN_DIRECTION.x, -SUN_DIRECTION.z, SUN_DIRECTION.y)).normalized()
    sun = bpy.data.lights.new("sun", "SUN")
    sun.color = SUN_COLOR
    sun.energy = 2.0 * math.pi / 2.0
    sun.angle = math.radians(2)
    sun.use_shadow = False  # the game casts no shadows yet
    ob = bpy.data.objects.new("sun", sun)
    bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()


def add_ground(low, high):
    size = max(6.0, (high - low).length * 4)
    bpy.ops.mesh.primitive_plane_add(size=size, location=((low.x + high.x) / 2, (low.y + high.y) / 2, low.z - 0.001))
    ground = bpy.context.object
    material = bpy.data.materials.new("ground")
    material.use_nodes = True
    material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*GROUND_TILE_COLOR, 1.0)
    material.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1.0
    ground.data.materials.append(material)


def render(yaw, objects, low, high, size, margin, path):
    scene = bpy.context.scene
    center = (low + high) / 2
    radius = (high - low).length / 2 * margin
    camera_data = bpy.data.cameras.new("game")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = radius * 2
    camera = bpy.data.objects.new("game", camera_data)
    scene.collection.objects.link(camera)
    azimuth = math.radians(yaw)
    pitch = math.radians(ISO_PITCH_DEG)
    # three.js camera sits at (sin yaw, up, cos yaw) around the focus; Blender: x = sin, y = -cos
    offset = Vector((math.sin(azimuth) * math.cos(pitch), -math.cos(azimuth) * math.cos(pitch), math.sin(pitch))) * 40
    camera.location = center + offset
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(camera)


def sheet(paths, out):
    images = [bpy.data.images.load(p) for p in paths]
    width, height = images[0].size
    pixels = [0.0] * (width * len(images) * height * 4)
    for index, image in enumerate(images):
        data = list(image.pixels)
        for row in range(height):
            start = (row * width * len(images) + index * width) * 4
            pixels[start:start + width * 4] = data[row * width * 4:(row + 1) * width * 4]
    result = bpy.data.images.new("sheet", width * len(images), height)
    result.pixels = pixels
    result.filepath_raw = out
    result.file_format = "PNG"
    result.save()


def main():
    args = parse()
    global CELL, COLUMNS
    CELL = args.cell
    COLUMNS = args.columns
    paths = args.input.split(",")
    load(paths)
    objects = meshes()
    if not objects:
        raise SystemExit("no mesh in input")
    low, high = bounds(objects)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in [
        i.identifier for i in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
    ] else "BLENDER_EEVEE_NEXT"
    scene.render.film_transparent = False
    setup_world()
    add_sun()
    add_ground(low, high)
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (*BACKGROUND, 1.0)
    name = os.path.splitext(os.path.basename(paths[0]))[0] + ("-set" if len(paths) > 1 else "")
    os.makedirs(args.out, exist_ok=True)
    paths = []
    for yaw in [float(y) for y in args.yaws.split(",")]:
        path = os.path.join(args.out, f"{name}-game-{int(yaw)}.png")
        render(yaw, objects, low, high, args.size, args.margin, path)
        paths.append(path)
    sheet(paths, os.path.join(args.out, f"{name}-game-sheet.png"))
    print(f"game_render: {len(paths)} views in {args.out}")


main()
