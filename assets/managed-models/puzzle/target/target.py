"""Target of the Daily puzzle (the Deliver aim, and the exit of the Collect aim), vivid style, one tile wide. A blue cup the ball drops into, a bullseye at the bottom and a gold halo around it.
Three meshes under one root: the fixed cup, the bullseye and the halo. Two glTF clips: `idle` (the bullseye and the halo pulse, loops) and `reach` (the bullseye pops up and the halo bursts out, played
when the ball is delivered)."""
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
SIDES = 12
BASE_H = 0.03
RIM_OUT = 0.4
RIM_IN = 0.27
RIM_H = 0.11
FLOOR_Z = BASE_H
HALO_OUT = 0.48
HALO_IN = 0.42
HALO_H = 0.015
HIDDEN = 0.001

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("coral", "#ff4f4f", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5),
])


def cup_parts():
    rim = lpm.ring("rim", SIDES, RIM_OUT, RIM_IN, RIM_H, at=(0, 0, BASE_H), color=P["cobalt"])
    lpm.paint(rim, P["cream"], where=lambda c, n, i: n.z > 0.5)
    return [lpm.prism("base", SIDES, 0.46, BASE_H, color=P["cobalt_dark"], radius_top=0.44), rim]


def bullseye_parts():
    rings = [("outer", 0.26, "coral"), ("middle", 0.18, "sun"), ("inner", 0.09, "cream")]
    return [lpm.prism(f"bullseye {name}", SIDES, radius, 0.006, at=(0, 0, FLOOR_Z + 0.006 * index), color=P[color]) for index, (name, radius, color) in enumerate(rings)]


def halo_parts():
    return [lpm.ring("halo", SIDES, HALO_OUT, HALO_IN, HALO_H, at=(0, 0, 0.0), color=P["sun"])]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, origin_z, keys):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. keys: (frame, lift, size)."""
    action = bpy.data.actions.new(f"{name}-{ob.name}")
    ob.animation_data_create().action = action
    for frame, lift, size in keys:
        ob.location.z = origin_z + lift
        ob.scale = (size, size, size)
        ob.keyframe_insert("location", index=2, frame=frame)
        ob.keyframe_insert("scale", frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


cup = lpm.finish("TargetCup", cup_parts(), P, budget=160, ground=False, center=False)
bullseye = lpm.finish("TargetBullseye", bullseye_parts(), P, budget=140, ground=False, center=False)
halo = lpm.finish("TargetHalo", halo_parts(), P, budget=100, ground=False, center=False)
shared = cup.data.materials[0]
for ob in (bullseye, halo):
    spare = ob.data.materials[0]
    ob.data.materials[0] = shared
    bpy.data.materials.remove(spare)

put_origin(bullseye, (0, 0, FLOOR_Z))
put_origin(halo, (0, 0, 0.0))
root = bpy.data.objects.new("Target", None)
bpy.context.scene.collection.objects.link(root)
for ob in (cup, bullseye, halo):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip(bullseye, "reach", FLOOR_Z, [(1, 0.0, 1.0), (5, 0.07, 1.2), (10, -0.01, 0.95), (14, 0.01, 1.03), (18, 0.0, 1.0)])
clip(halo, "reach", 0.0, [(1, 0.0, 1.0), (8, 0.0, 1.7), (12, 0.0, HIDDEN), (20, 0.0, HIDDEN), (26, 0.0, 1.0)])
# The last track decides the pose at frame 1, the rest pose of the glTF nodes: `idle` starts at rest size.
clip(bullseye, "idle", FLOOR_Z, [(1, 0.0, 1.0), (19, 0.0, 1.05), (37, 0.0, 1.0)])
clip(halo, "idle", 0.0, [(1, 0.0, 1.0), (19, 0.0, 1.05), (37, 0.0, 1.0)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, cup, bullseye, halo):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
