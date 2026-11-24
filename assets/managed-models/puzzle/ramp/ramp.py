"""Ramp of the Daily puzzle, vivid style, one tile wide. It slopes down toward +X, the way of a right-hand ramp (the game mirrors it for the left).
A passive part, so it has a single glTF clip: `hit` (the surface takes the knock of the ball and springs back). Two meshes under one root: the fixed body with its rails, and the surface."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
HALF = 0.48
HIGH = 0.5
LOW = 0.08
THICK = 0.035
RAIL = 0.09
BODY_WIDTH = 0.8
SURFACE_WIDTH = 0.64
RAIL_WIDTH = 0.06

SLOPE = (HIGH - LOW) / (2 * HALF)
ANGLE = math.degrees(math.atan(SLOPE))
NORMAL = (math.sin(math.radians(ANGLE)), math.cos(math.radians(ANGLE)))

lpm.reset()
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("coral", "#ff4f4f", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5),
])


def line_z(x):
    """Height of the top of the body at `x`."""
    return (HIGH + LOW) / 2 - SLOPE * x


def slab(name, height, width, y=0.0, color=0):
    """A strip lying on the slope, `height` thick, from the top of the body."""
    outline = [(-HALF, HIGH), (HALF, LOW), (HALF, LOW + height), (-HALF, HIGH + height)]
    return lpm.sweep(name, outline, width, at=(0, y, 0), color=color)


def body_parts():
    parts = [lpm.sweep("body", [(-HALF, 0), (HALF, 0), (HALF, LOW), (-HALF, HIGH)], BODY_WIDTH, color=P["cobalt"])]
    for name, sign in (("left", -1), ("right", 1)):
        parts.append(slab(f"rail {name}", RAIL, RAIL_WIDTH, y=sign * (SURFACE_WIDTH + RAIL_WIDTH) / 2, color=P["sun"]))
    parts.append(lpm.box("foot", (2 * HALF + 0.04, BODY_WIDTH + 0.04, 0.02), color=P["cobalt_dark"]))
    return parts


def chevron(x, index):
    top = line_z(x) + THICK
    arrow = lpm.prism(f"chevron {index}", 3, 0.11, 0.008, at=(x, 0, top), color=P["cream"])
    return lpm.rotate(arrow, ANGLE, axis="Y", about=(x, 0, top))


def surface_parts():
    return [slab("surface", THICK, SURFACE_WIDTH, color=P["coral"]), chevron(-0.2, 0), chevron(0.16, 1)]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, dips, origin):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. `dips` are (frame, depth): how far the surface is pushed in along its normal."""
    action = bpy.data.actions.new(name)
    ob.animation_data_create().action = action
    for frame, depth in dips:
        ob.location = (origin[0] - NORMAL[0] * depth, origin[1], origin[2] - NORMAL[1] * depth)
        ob.keyframe_insert("location", frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


body = lpm.finish("RampBody", body_parts(), P, budget=120, ground=False, center=False)
surface = lpm.finish("RampSurface", surface_parts(), P, budget=80, ground=False, center=False)
shared = body.data.materials[0]
spare = surface.data.materials[0]
surface.data.materials[0] = shared
bpy.data.materials.remove(spare)

origin = (0.0, 0.0, line_z(0) + THICK)
put_origin(surface, origin)
root = bpy.data.objects.new("Ramp", None)
bpy.context.scene.collection.objects.link(root)
for ob in (body, surface):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip(surface, "hit", [(1, 0.0), (4, 0.03), (9, -0.012), (13, 0.006), (18, 0.0)], origin)

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, body, surface):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
