"""Switch of the Daily puzzle (the Flip aim), vivid style, three quarters of a tile wide. A lever on a plate and a lamp. At rest it is off: the lever leans to -X and the lamp is dark.
Three meshes under one root: the fixed plate, the lever and the lamp. Two glTF clips, played in turn, one for each crossing of the ball: `on` (the lever snaps to +X and the lamp lights)
and `off` (the way back)."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
PLATE_H = 0.05
PIVOT_Z = PLATE_H + 0.03
LEAN = 32.0
LAMP_AT = (0.0, -0.25, PLATE_H)
HIDDEN = 0.001

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.5),
    ("coral", "#ff4f4f", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5), ("graphite", "#2a2d3a", 0.0, 0.7),
    ("lamp", "#7be01f", 0.0, 0.4, 1.8),
])


def plate_parts():
    return [
        lpm.prism("plate", 12, 0.4, PLATE_H, color=P["cobalt"], radius_top=0.38),
        lpm.box("slot", (0.46, 0.13, 0.012), at=(0, 0, PLATE_H), color=P["graphite"]),
        lpm.prism("lamp seat", 10, 0.085, 0.02, at=LAMP_AT, color=P["graphite"], radius_top=0.075),
        lpm.box("slot stripe left", (0.04, 0.13, 0.012), at=(-0.25, 0, PLATE_H), color=P["cream"]),
        lpm.box("slot stripe right", (0.04, 0.13, 0.012), at=(0.25, 0, PLATE_H), color=P["cream"]),
    ]


def lever_parts():
    stalk = lpm.box("stalk", (0.05, 0.05, 0.26), at=(0, 0, PIVOT_Z), color=P["coral"], taper=(0.8, 0.8))
    knob = lpm.prism("knob", 8, 0.07, 0.08, at=(0, 0, PIVOT_Z + 0.24), color=P["sun"], radius_top=0.062)
    hub = lpm.prism("hub", 8, 0.06, 0.05, at=(0, 0, PIVOT_Z - 0.04), color=P["cobalt_dark"])
    return [stalk, knob, hub]


def lamp_parts():
    return [lpm.lathe("lamp", [(0.07, 0.0), (0.068, 0.025), (0.046, 0.05), (0.0, 0.062)], segments=8, at=(LAMP_AT[0], LAMP_AT[1], LAMP_AT[2] + 0.02), color=P["lamp"])]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, keys):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. keys: (frame, lean in degrees or None, size or None)."""
    action = bpy.data.actions.new(f"{name}-{ob.name}")
    ob.animation_data_create().action = action
    for frame, lean, size in keys:
        if lean is not None:
            ob.rotation_euler = (0.0, math.radians(lean), 0.0)
            ob.keyframe_insert("rotation_euler", index=1, frame=frame)
        if size is not None:
            ob.scale = (size, size, size)
            ob.keyframe_insert("scale", frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


plate = lpm.finish("SwitchPlate", plate_parts(), P, budget=160, ground=False, center=False)
lever = lpm.finish("SwitchLever", lever_parts(), P, budget=100, ground=False, center=False)
lamp = lpm.finish("SwitchLamp", lamp_parts(), P, budget=80, ground=False, center=False)
shared = plate.data.materials[0]
for ob in (lever, lamp):
    spare = ob.data.materials[0]
    ob.data.materials[0] = shared
    bpy.data.materials.remove(spare)

put_origin(lever, (0, 0, PIVOT_Z))
put_origin(lamp, (LAMP_AT[0], LAMP_AT[1], LAMP_AT[2] + 0.02))
root = bpy.data.objects.new("Switch", None)
bpy.context.scene.collection.objects.link(root)
for ob in (plate, lever, lamp):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip(lever, "off", [(1, LEAN, None), (5, -LEAN - 10, None), (8, -LEAN + 5, None), (11, -LEAN - 2, None), (14, -LEAN, None)])
clip(lamp, "off", [(1, None, 1.0), (4, None, 0.5), (7, None, HIDDEN), (14, None, HIDDEN)])
# The last track decides the pose at frame 1, the rest pose of the glTF nodes: `on` starts with the lever leaning to -X and the lamp hidden, which is the off state.
clip(lever, "on", [(1, -LEAN, None), (5, LEAN + 10, None), (8, LEAN - 5, None), (11, LEAN + 2, None), (14, LEAN, None)])
clip(lamp, "on", [(1, None, HIDDEN), (4, None, HIDDEN), (6, None, 1.35), (9, None, 0.9), (12, None, 1.0)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, plate, lever, lamp):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
