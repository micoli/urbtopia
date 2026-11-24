"""Ball of the Daily puzzle, vivid style. A magenta sphere with a cream stripe around its equator and sun tips on its poles, so that its turning shows when it rolls.
One mesh with its origin at its centre and three glTF clips: `idle` (it breathes, loops), `roll` (it turns on itself toward +X, loops) and `land` (it squashes on an impact and springs back)."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
RADIUS = 0.14
SEGMENTS = 12
LATITUDES = 5

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([("magenta", "#ff2d95", 0.0, 0.35), ("cream", "#fff1c9", 0.0, 0.45), ("sun", "#ffc61a", 0.0, 0.4)])


def sphere():
    profile = [(RADIUS * math.sin(math.pi * k / LATITUDES), RADIUS * (1 - math.cos(math.pi * k / LATITUDES))) for k in range(LATITUDES + 1)]
    ball = lpm.lathe("ball", profile, segments=SEGMENTS, color=P["magenta"])
    lpm.paint(ball, P["cream"], where=lambda c, n, i: abs(c.z - RADIUS) < RADIUS * 0.55)
    lpm.paint(ball, P["sun"], where=lambda c, n, i: abs(c.z - RADIUS) > RADIUS * 0.8)
    return ball


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, keys):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. keys: (frame, spread, height, turn in degrees).
    The ball stays on the ground while it squashes: its centre sits at RADIUS times its height."""
    action = bpy.data.actions.new(name)
    ob.animation_data_create().action = action
    for frame, spread, height, turn in keys:
        ob.location.z = RADIUS * height
        ob.scale = (spread, spread, height)
        ob.rotation_euler = (0.0, math.radians(turn), 0.0)
        for path in ("location", "scale", "rotation_euler"):
            ob.keyframe_insert(path, frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


ball = lpm.finish("Ball", [sphere()], P, budget=160, ground=True, center=True)
put_origin(ball, (0, 0, RADIUS))
bpy.context.scene.render.fps = FPS

clip(ball, "land", [(1, 1.0, 1.0, 0), (4, 1.28, 0.6, 0), (8, 0.9, 1.18, 0), (12, 1.04, 0.94, 0), (16, 1.0, 1.0, 0)])
clip(ball, "roll", [(1, 1.0, 1.0, 0), (28, 1.0, 1.0, 360)])
# The last track decides the pose at frame 1, the rest pose of the glTF node: `idle` starts at rest size.
clip(ball, "idle", [(1, 1.0, 1.0, 0), (19, 1.03, 0.94, 0), (37, 1.0, 1.0, 0)])

bpy.ops.object.select_all(action="DESELECT")
ball.select_set(True)
bpy.context.view_layer.objects.active = ball
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
