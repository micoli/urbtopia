"""Fan of the Daily puzzle, vivid style, one tile wide. It blows toward +X, the way of a right-hand fan (the game mirrors it for the left).
Three meshes under one root: the fixed housing, the rotor and the wind streaks. Two glTF clips: `idle` (the rotor turns slowly, loops) and `blow` (the rotor races and
streaks of wind run out of the fan, loops; played while the ball is in the jet)."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
CENTER_Z = 0.36
RADIUS = 0.22
DEPTH = 0.2
WIND_X = 0.26
HIDDEN = 0.001

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("coral", "#ff4f4f", 0.0, 0.5), ("sun", "#ffc61a", 0.0, 0.5), ("graphite", "#2a2d3a", 0.0, 0.7), ("white", "#ffffff", 0.0, 0.5),
])


def along_x(ob, x=0.0):
    """Turns a part built along Z so that it points along +X, and puts its start at `x`, centred on the fan axis."""
    lpm.rotate(ob, 90, axis="Y")
    return lpm.move(ob, dx=x, dz=CENTER_Z)


RIM = 0.04
INNER = RADIUS - 0.035
BLADE_TIP = 0.165
STRUTS = 6


def strut(index):
    """Uprights along X that hold the front grille and the rear grille together, and leave the sides of the housing open so that the blades show."""
    angle = math.radians(30 + 360 * index / STRUTS)
    y, z = (RADIUS - 0.022) * math.cos(angle), CENTER_Z + (RADIUS - 0.022) * math.sin(angle)
    return lpm.box(f"strut{index}", (DEPTH - 2 * RIM, 0.04, 0.04), at=(0, y, z - 0.02), color=P["cream"])


def housing_parts():
    return [
        lpm.box("foot", (0.5, 0.4, 0.04), color=P["cobalt_dark"]),
        lpm.box("post", (0.16, 0.16, CENTER_Z - RADIUS - 0.04 + 0.03), at=(-0.02, 0, 0.04), color=P["cobalt"], taper=(0.7, 0.7)),
        along_x(lpm.ring("rear rim", 12, RADIUS, INNER, RIM, color=P["cobalt_dark"]), -DEPTH / 2),
        along_x(lpm.ring("front rim", 12, RADIUS + 0.008, INNER, RIM, color=P["cream"]), DEPTH / 2 - RIM),
        lpm.box("rear bar tall", (0.012, 0.02, 2 * RADIUS), at=(-DEPTH / 2 + RIM - 0.006, 0, CENTER_Z - RADIUS), color=P["graphite"]),
        lpm.box("rear bar wide", (0.012, 2 * RADIUS, 0.02), at=(-DEPTH / 2 + RIM - 0.006, 0, CENTER_Z - 0.01), color=P["graphite"]),
        along_x(lpm.prism("motor", 8, 0.07, 0.06, color=P["graphite"]), -DEPTH / 2 - 0.06 + RIM),
        lpm.box("guard bar tall", (0.012, 0.02, 2 * RADIUS), at=(DEPTH / 2 + 0.005, 0, CENTER_Z - RADIUS), color=P["cream"]),
        lpm.box("guard bar wide", (0.012, 2 * RADIUS, 0.02), at=(DEPTH / 2 + 0.005, 0, CENTER_Z - 0.01), color=P["cream"]),
    ] + [strut(index) for index in range(STRUTS)]


def rotor_parts():
    parts = [along_x(lpm.prism("hub", 8, 0.05, 0.07, color=P["sun"]), -0.035)]
    for index in range(4):
        blade = lpm.box(f"blade{index}", (0.02, 0.075, BLADE_TIP - 0.04), at=(0, 0, 0.04), color=P["coral"])
        lpm.rotate(blade, 90 * index, axis="X")
        parts.append(lpm.move(blade, dz=CENTER_Z))
    return parts


def wind_parts():
    heights = (0.04, 0.0, -0.04)
    return [lpm.box(f"streak{index}", (0.16, 0.026, 0.026), at=(WIND_X, 0.1 * (index - 1), CENTER_Z - 0.013 + heights[index]), color=P["white"]) for index in range(3)]


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, **channels):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name. channels: rotation=[(frame, degrees)], push=[(frame, x, size)]."""
    action = bpy.data.actions.new(f"{name}-{ob.name}")
    ob.animation_data_create().action = action
    for frame, degrees in channels.get("rotation", []):
        ob.rotation_euler = (math.radians(degrees), 0.0, 0.0)
        ob.keyframe_insert("rotation_euler", index=0, frame=frame)
    for frame, x, size in channels.get("push", []):
        ob.location.x = x
        ob.scale = (size, size, size)
        ob.keyframe_insert("location", index=0, frame=frame)
        ob.keyframe_insert("scale", frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


housing = lpm.finish("FanHousing", housing_parts(), P, budget=400, ground=False, center=False)
rotor = lpm.finish("FanRotor", rotor_parts(), P, budget=160, ground=False, center=False)
wind = lpm.finish("FanWind", wind_parts(), P, budget=80, ground=False, center=False)
shared = housing.data.materials[0]
for ob in (rotor, wind):
    spare = ob.data.materials[0]
    ob.data.materials[0] = shared
    bpy.data.materials.remove(spare)

put_origin(rotor, (0, 0, CENTER_Z))
put_origin(wind, (WIND_X, 0, CENTER_Z))
root = bpy.data.objects.new("Fan", None)
bpy.context.scene.collection.objects.link(root)
for ob in (housing, rotor, wind):
    ob.parent = root
bpy.context.scene.render.fps = FPS

clip(rotor, "blow", rotation=[(1, 0), (31, 720)])
clip(wind, "blow", push=[(1, WIND_X, HIDDEN), (8, WIND_X + 0.04, 1.0), (22, WIND_X + 0.16, 1.0), (30, WIND_X + 0.22, HIDDEN)])
# The last track decides the pose at frame 1, the rest pose of the glTF node: `idle` starts with the rotor at 0 and the wind hidden.
clip(rotor, "idle", rotation=[(1, 0), (91, 360)])
clip(wind, "idle", push=[(1, WIND_X, HIDDEN), (91, WIND_X, HIDDEN)])

bpy.ops.object.select_all(action="DESELECT")
for ob in (root, housing, rotor, wind):
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
