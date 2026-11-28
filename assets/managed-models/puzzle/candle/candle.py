"""Candle of the Daily puzzle (the Light aim), vivid style, half a tile wide. It stands unlit at rest: the flame is hidden.
Two meshes under one root: the fixed candle (dish, wax and wick) and the flame. Two glTF clips: `light` (the flame catches, played once when the ball passes) and `burn` (the flame flickers, loops,
played after `light`)."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
SIDES = 10
DISH_H = 0.035
WAX_H = 0.34
WAX_BAND = 0.23
WICK_H = 0.05
FLAME_Z = DISH_H + WAX_H + WICK_H - 0.012
HIDDEN = 0.001

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.5),
    ("coral", "#ff4f4f", 0.0, 0.5), ("graphite", "#2a2d3a", 0.0, 0.7),
    ("flame", "#ff9a1f", 0.0, 0.4, 1.6), ("flame_core", "#fff3b0", 0.0, 0.4, 2.0),
])


def candle_parts():
    return [
        lpm.prism("dish", 12, 0.27, DISH_H, color=P["cobalt"], radius_top=0.25),
        lpm.ring("dish rim", 12, 0.27, 0.2, 0.03, at=(0, 0, DISH_H), color=P["cobalt_dark"]),
        lpm.prism("wax", SIDES, 0.1, WAX_BAND, at=(0, 0, DISH_H), color=P["coral"], radius_top=0.097),
        lpm.prism("wax top", SIDES, 0.097, WAX_H - WAX_BAND, at=(0, 0, DISH_H + WAX_BAND), color=P["cream"], radius_top=0.09),
        lpm.box("wick", (0.014, 0.014, WICK_H), at=(0, 0, DISH_H + WAX_H - 0.012), color=P["graphite"]),
    ]


def flame_parts():
    outer = lpm.lathe("flame", [(0.0, 0.0), (0.05, 0.03), (0.055, 0.075), (0.032, 0.125), (0.0, 0.18)], segments=8, at=(0, 0, FLAME_Z), color=P["flame"])
    core = lpm.lathe("flame core", [(0.0, 0.004), (0.026, 0.03), (0.026, 0.06), (0.0, 0.1)], segments=8, at=(0, 0, FLAME_Z), color=P["flame_core"])
    return [outer, core]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, keys):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. keys: (frame, (width, depth, height), sway in degrees)."""
    action = bpy.data.actions.new(name)
    ob.animation_data_create().action = action
    for frame, size, sway in keys:
        ob.scale = size
        ob.rotation_euler = (0.0, math.radians(sway), 0.0)
        ob.keyframe_insert("scale", frame=frame)
        ob.keyframe_insert("rotation_euler", index=1, frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


candle = lpm.finish("CandleBody", candle_parts(), P, budget=260, ground=False, center=False)
flame = lpm.finish("CandleFlame", flame_parts(), P, budget=120, ground=False, center=False)
shared = candle.data.materials[0]
spare = flame.data.materials[0]
flame.data.materials[0] = shared
bpy.data.materials.remove(spare)

put_origin(flame, (0, 0, FLAME_Z))
root = bpy.data.objects.new("Candle", None)
bpy.context.scene.collection.objects.link(root)
for ob in (candle, flame):
    ob.parent = root
bpy.context.scene.render.fps = FPS

one = (1.0, 1.0, 1.0)
none = (HIDDEN, HIDDEN, HIDDEN)
clip(flame, "burn", [(1, one, 0.0), (5, (0.94, 0.94, 1.1), 3.0), (9, (1.05, 1.05, 0.92), -3.0), (14, (0.97, 0.97, 1.08), 2.0), (19, (1.03, 1.03, 0.95), -2.0), (25, one, 0.0)])
# The last track decides the pose at frame 1, the rest pose of the glTF node: `light` starts with the flame hidden, so the candle stands unlit.
clip(flame, "light", [(1, none, 0.0), (3, none, 0.0), (6, (1.3, 1.3, 1.5), 0.0), (9, (0.9, 0.9, 0.85), 0.0), (12, one, 0.0)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, candle, flame):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
