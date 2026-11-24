"""Spring of the Daily puzzle, vivid style, one tile wide (the right-hand version: the chevron on the head points to +X, the game mirrors it for the left).
Three meshes under one root: the fixed base, the coil and the head. Two glTF clips: `idle` (loops) and `launch` (played when the ball lands)."""
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
BASE_H = 0.05
COIL_H = 0.3
SPREAD = 0.14

lpm.reset()
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("lime", "#7be01f", 0.0, 0.45), ("coral", "#ff4f4f", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5),
])


def base_parts():
    return [
        lpm.prism("base", 10, 0.36, BASE_H, color=P["cobalt"], radius_top=0.33),
        lpm.prism("base stripe", 10, 0.345, 0.012, at=(0, 0, 0.022), color=P["cream"]),
        lpm.prism("base foot", 10, 0.38, 0.016, color=P["cobalt_dark"]),
    ]


def coil_parts():
    teeth = [(0.06, 0.0)]
    turns = 3
    for turn in range(turns):
        z = COIL_H * (turn + 0.5) / turns
        teeth += [(0.22, z), (0.06, COIL_H * (turn + 1) / turns)]
    return [lpm.lathe("coil", teeth, segments=10, at=(0, 0, BASE_H), color=P["lime"])]


def head_parts():
    top = BASE_H + COIL_H
    return [
        lpm.prism("head", 10, 0.27, 0.045, at=(0, 0, top), color=P["coral"], radius_top=0.255),
        lpm.prism("head stripe", 10, 0.262, 0.01, at=(0, 0, top + 0.017), color=P["cream"]),
        lpm.prism("pad", 10, 0.19, 0.006, at=(0, 0, top + 0.045), color=P["sun"]),
        lpm.prism("chevron", 3, 0.1, 0.006, at=(0.02, 0, top + 0.051), color=P["coral"]),
    ]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def pose(coil, head, squash):
    """squash is the height of the coil, 1.0 at rest. The head rides on the top of the coil and the coil bulges when pressed."""
    bulge = 1.0 + (1.0 - squash) * SPREAD
    coil.scale = (bulge, bulge, squash)
    head.location.z = BASE_H + COIL_H * squash


def clip(name, keys, coil, head):
    """One action per object, each pushed on its own NLA track named after the clip, which the glTF export writes as one clip."""
    for ob in (coil, head):
        action = bpy.data.actions.new(f"{name}-{ob.name}")
        ob.animation_data_create().action = action
        for frame, squash in keys:
            pose(coil, head, squash)
            ob.keyframe_insert("location", index=2, frame=frame) if ob is head else ob.keyframe_insert("scale", frame=frame)
        track = ob.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, int(action.frame_range[0]), action)
        ob.animation_data.action = None


base = lpm.finish("SpringBase", base_parts(), P, budget=160, ground=False, center=False)
coil = lpm.finish("SpringCoil", coil_parts(), P, budget=260, ground=False, center=False)
head = lpm.finish("SpringHead", head_parts(), P, budget=200, ground=False, center=False)
shared = base.data.materials[0]
for ob in (coil, head):
    spare = ob.data.materials[0]
    ob.data.materials[0] = shared
    bpy.data.materials.remove(spare)

put_origin(coil, (0, 0, BASE_H))
put_origin(head, (0, 0, BASE_H + COIL_H))
root = bpy.data.objects.new("Spring", None)
bpy.context.scene.collection.objects.link(root)
for ob in (base, coil, head):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip("idle", [(1, 1.0), (31, 1.035), (61, 1.0)], coil, head)
clip("launch", [(1, 1.0), (6, 0.38), (9, 1.3), (13, 0.88), (17, 1.08), (21, 0.97), (26, 1.0)], coil, head)

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, base, coil, head):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
