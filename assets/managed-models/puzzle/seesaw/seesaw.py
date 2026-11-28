"""Seesaw of the Daily puzzle, vivid style, one tile wide. At rest the plank slopes down to +X, the way of a right-hand seesaw (the game mirrors it for the left).
Two meshes under one root, the fixed fulcrum and the plank, and three glTF clips on the plank: `idle` (loops), `flip-left` (the plank goes from sloping right to sloping left)
and `flip-right` (the way back). The game plays them in turn, one for each pass of the ball."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
PIVOT_Z = 0.21
TILT = 18.0
LENGTH = 0.9
WIDTH = 0.46

lpm.reset()
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("coral", "#ff4f4f", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5), ("graphite", "#2a2d3a", 0.0, 0.7),
])


def fulcrum_parts():
    pin = lpm.prism("pin", 8, 0.045, WIDTH + 0.1, color=P["sun"])  # lies along Y once turned, from 0 to -length
    pin = lpm.rotate(pin, 90, axis="X")
    pin = lpm.move(pin, dz=PIVOT_Z - 0.01, dy=(WIDTH + 0.1) / 2)
    return [
        lpm.box("foot", (0.62, WIDTH, 0.03), color=P["cobalt_dark"]),
        lpm.box("post", (0.34, WIDTH - 0.08, PIVOT_Z - 0.045), at=(0, 0, 0.03), color=P["cobalt"], taper=(0.26, 1.0)),
        lpm.box("post stripe", (0.2, WIDTH - 0.07, 0.014), at=(0, 0, 0.075), color=P["cream"], taper=(0.82, 1.0)),
        pin,
    ]


def plank_parts():
    low = PIVOT_Z
    return [
        lpm.box("plank", (LENGTH, WIDTH - 0.1, 0.05), at=(0, 0, low), color=P["coral"]),
        lpm.box("plank stripe", (LENGTH - 0.3, 0.05, 0.008), at=(0, 0, low + 0.05), color=P["cream"]),
        lpm.box("rail left", (LENGTH, 0.05, 0.075), at=(0, -(WIDTH - 0.05) / 2, low), color=P["cobalt"]),
        lpm.box("rail right", (LENGTH, 0.05, 0.075), at=(0, (WIDTH - 0.05) / 2, low), color=P["cobalt"]),
        lpm.box("bumper left", (0.08, WIDTH, 0.1), at=(-LENGTH / 2 - 0.02, 0, low), color=P["sun"]),
        lpm.box("bumper right", (0.08, WIDTH, 0.1), at=(LENGTH / 2 + 0.02, 0, low), color=P["sun"]),
    ]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, tilts):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. `tilts` are (frame, degrees); positive slopes down to +X."""
    action = bpy.data.actions.new(name)
    ob.animation_data_create().action = action
    for frame, degrees in tilts:
        ob.rotation_euler = (0.0, math.radians(degrees), 0.0)
        ob.keyframe_insert("rotation_euler", index=1, frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


fulcrum = lpm.finish("SeesawFulcrum", fulcrum_parts(), P, budget=200, ground=False, center=False)
plank = lpm.finish("SeesawPlank", plank_parts(), P, budget=200, ground=False, center=False)
shared = fulcrum.data.materials[0]
spare = plank.data.materials[0]
plank.data.materials[0] = shared
bpy.data.materials.remove(spare)

put_origin(plank, (0, 0, PIVOT_Z))
root = bpy.data.objects.new("Seesaw", None)
bpy.context.scene.collection.objects.link(root)
for ob in (fulcrum, plank):
    ob.parent = root
bpy.context.scene.render.fps = FPS
plank.rotation_mode = "XYZ"

clip(plank, "flip-left", [(1, TILT), (7, -TILT - 7), (11, -TILT + 5), (15, -TILT - 2.5), (19, -TILT + 1), (24, -TILT)])
clip(plank, "flip-right", [(1, -TILT), (7, TILT + 7), (11, TILT - 5), (15, TILT + 2.5), (19, TILT - 1), (24, TILT)])
# The last track decides the pose at frame 1, which is the rest pose of the glTF node: `idle` starts on the right-hand slope.
clip(plank, "idle", [(1, TILT), (31, TILT + 1.6), (61, TILT)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, fulcrum, plank):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
