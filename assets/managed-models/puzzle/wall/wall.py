"""Side wall of the Daily puzzle, vivid style: one cell tall and 0.3 thick, the origin on the middle of its inner face at the bottom, the inner face toward +X (the left-hand wall; the game mirrors it for the
right-hand one and stacks one on top of the other along the board). One mesh and one glTF clip: `bump` (the wall gives a little when the ball hits it)."""
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
THICK = 0.3
DEPTH = 0.6

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5)])


def wall_parts():
    mid = -THICK / 2
    parts = [
        lpm.box("body", (THICK - 0.02, DEPTH - 0.04, 1.0), at=(mid, 0, 0), color=P["cobalt_dark"]),
        lpm.box("cap top", (THICK + 0.02, DEPTH, 0.1), at=(mid, 0, 0.9), color=P["cobalt"]),
        lpm.box("cap bottom", (THICK + 0.02, DEPTH, 0.1), at=(mid, 0, 0.0), color=P["cobalt"]),
        lpm.box("face", (0.04, DEPTH - 0.1, 0.56), at=(-0.01, 0, 0.22), color=P["cream"]),
        lpm.box("rivet top", (0.06, 0.07, 0.07), at=(-0.01, -DEPTH / 2 + 0.12, 0.76), color=P["sun"]),
        lpm.box("rivet bottom", (0.06, 0.07, 0.07), at=(-0.01, DEPTH / 2 - 0.12, 0.17), color=P["sun"]),
    ]
    return parts


wall = lpm.finish("Wall", wall_parts(), P, budget=120, ground=False, center=False)
bpy.context.scene.render.fps = FPS

action = bpy.data.actions.new("bump")
wall.animation_data_create().action = action
for frame, squash in ((1, 1.0), (4, 0.8), (8, 1.05), (12, 0.98), (16, 1.0)):
    wall.scale = (squash, 1.0, 1.0)
    wall.keyframe_insert("scale", frame=frame)
track = wall.animation_data.nla_tracks.new()
track.name = "bump"
track.strips.new("bump", int(action.frame_range[0]), action)
wall.animation_data.action = None

bpy.ops.object.select_all(action="DESELECT")
wall.select_set(True)
bpy.context.view_layer.objects.active = wall
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
