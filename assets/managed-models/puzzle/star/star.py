"""Star of the Daily puzzle (the Collect aim), vivid style, one tile wide. A regular five-pointed gold star that floats over a small pad.
Two meshes under one root: the fixed pad and the star. Two glTF clips: `idle` (the star turns on its vertical axis and bobs, loops) and `collect` (the star rises, spins fast and vanishes, played when
the ball takes it; the star stays hidden afterwards)."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
HOVER = 0.38
OUTER = 0.3
HIDDEN = 0.001
YAW = 45.0
TILT = 30.0

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6),
    ("star", "#ffb400", 0.0, 0.35, 1.0), ("star_light", "#ffe45c", 0.0, 0.35, 1.3),
])


def pad_parts():
    return [
        lpm.prism("pad", 12, 0.22, 0.03, color=P["cobalt"], radius_top=0.2),
        lpm.prism("pad top", 12, 0.12, 0.012, at=(0, 0, 0.03), color=P["cobalt_dark"]),
    ]


def star_parts():
    """A regular five-pointed star: the pentagram, the first tip up. Each arm has a ridge down its middle and two faces of a different gold, so it reads as a star from any side."""
    return [lpm.star("star", 5, OUTER, rim=0.025, depth=0.1, at=(0, 0, HOVER), colors=(P["star_light"], P["star"]))]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, keys):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. keys: (frame, height, size, turn in degrees about the vertical axis, from the rest yaw)."""
    action = bpy.data.actions.new(name)
    ob.animation_data_create().action = action
    for frame, height, size, turn in keys:
        ob.location.z = height
        ob.scale = (size, size, size)
        ob.rotation_euler = (math.radians(-TILT), 0.0, math.radians(YAW + turn))
        for path in ("location", "scale", "rotation_euler"):
            ob.keyframe_insert(path, frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


pad = lpm.finish("StarPad", pad_parts(), P, budget=120, ground=False, center=False)
star = lpm.finish("StarBody", star_parts(), P, budget=120, ground=False, center=False)
shared = pad.data.materials[0]
spare = star.data.materials[0]
star.data.materials[0] = shared
bpy.data.materials.remove(spare)

put_origin(star, (0, 0, HOVER))
root = bpy.data.objects.new("Star", None)
bpy.context.scene.collection.objects.link(root)
for ob in (pad, star):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip(star, "collect", [(1, HOVER, 1.0, 0), (6, HOVER + 0.12, 1.4, 270), (14, HOVER + 0.24, 0.8, 600), (18, HOVER + 0.28, HIDDEN, 720)])
# The last track decides the pose at frame 1, the rest pose of the glTF node: `idle` starts at hover height, facing the default isometric camera (turned by YAW about the vertical axis and leaning back by TILT).
clip(star, "idle", [(1, HOVER, 1.0, 0), (46, HOVER + 0.04, 1.0, 180), (91, HOVER, 1.0, 360)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, pad, star):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
