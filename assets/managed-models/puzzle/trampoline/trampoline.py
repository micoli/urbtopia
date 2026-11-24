"""Trampoline of the Daily puzzle, vivid style, one tile wide (the right-hand version; the game mirrors it for the left).
Two meshes under one root, the fixed frame and the mat, and two glTF clips on the mat: `idle` (loops) and `bounce` (played when the ball lands)."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
RIM_Z = 0.26
MAT_Z = 0.335

lpm.reset()
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("sun", "#ffc61a", 0.0, 0.5), ("coral", "#ff4f4f", 0.0, 0.5), ("white", "#ffffff", 0.0, 0.5), ("graphite", "#2a2d3a", 0.0, 0.7),
])


def leg(index):
    angle = math.radians(45 + 90 * index)
    x, y = 0.33 * math.cos(angle), 0.33 * math.sin(angle)
    return [
        lpm.prism(f"leg{index}", 6, 0.04, RIM_Z, at=(x, y, 0), color=P["graphite"], radius_top=0.032),
        lpm.prism(f"foot{index}", 8, 0.07, 0.03, at=(x, y, 0), color=P["cobalt_dark"], radius_top=0.06),
    ]


def frame_parts():
    parts = [
        lpm.prism("rim", 16, 0.47, 0.075, at=(0, 0, RIM_Z), color=P["cobalt"], radius_top=0.45),
        lpm.prism("rim stripe", 16, 0.462, 0.012, at=(0, 0, RIM_Z + 0.032), color=P["cream"]),
        lpm.prism("pad", 16, 0.44, 0.012, at=(0, 0, RIM_Z + 0.075), color=P["coral"], radius_top=0.43),
    ]
    for index in range(4):
        parts += leg(index)
    return parts


def mat_parts():
    return [
        lpm.prism("mat", 16, 0.395, 0.04, at=(0, 0, MAT_Z), color=P["sun"], radius_top=0.385),
        lpm.prism("target outer", 16, 0.2, 0.006, at=(0, 0, MAT_Z + 0.04), color=P["coral"]),
        lpm.prism("target middle", 16, 0.135, 0.006, at=(0, 0, MAT_Z + 0.046), color=P["white"]),
        lpm.prism("target inner", 16, 0.07, 0.006, at=(0, 0, MAT_Z + 0.052), color=P["coral"]),
    ]


def put_origin(ob, point):
    """Moves the origin of a finished mesh onto `point`, so that the clips scale and move the mat around its own centre."""
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def key(ob, frame, z=0.0, spread=1.0, height=1.0):
    ob.location.z = MAT_Z + z
    ob.scale = (spread, spread, height)
    ob.keyframe_insert("location", index=2, frame=frame)
    ob.keyframe_insert("scale", frame=frame)


def clip(ob, name, keys, loop=False):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name."""
    action = bpy.data.actions.new(name)
    ob.animation_data_create().action = action
    for frame, z, spread, height in keys:
        key(ob, frame, z, spread, height)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


frame = lpm.finish("TrampolineFrame", frame_parts(), P, budget=420, ground=False, center=False)
mat = lpm.finish("TrampolineMat", mat_parts(), P, budget=260, ground=False, center=False)
shared = frame.data.materials[0]
spare = mat.data.materials[0]
mat.data.materials[0] = shared
bpy.data.materials.remove(spare)

put_origin(mat, (0, 0, MAT_Z))
root = bpy.data.objects.new("Trampoline", None)
bpy.context.scene.collection.objects.link(root)
for ob in (frame, mat):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip(mat, "idle", [(1, 0.0, 1.0, 1.0), (31, 0.007, 1.012, 0.97), (61, 0.0, 1.0, 1.0)], loop=True)
clip(mat, "bounce", [(1, 0.0, 1.0, 1.0), (5, -0.055, 1.07, 0.55), (10, 0.05, 0.96, 1.25), (15, -0.018, 1.02, 0.85), (20, 0.01, 0.99, 1.05), (26, 0.0, 1.0, 1.0)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, frame, mat):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
print("tris", lpm.tri_count(frame), lpm.tri_count(mat))
