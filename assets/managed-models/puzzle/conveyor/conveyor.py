"""Conveyor of the Daily puzzle, vivid style, one tile wide. The belt runs toward +X, the way of a right-hand conveyor (the game mirrors it for the left).
Meshes under one root: the fixed frame with its belt, two end rollers and five chevrons that run along the belt. Two glTF clips, both loops: `idle` (slow) and `run` (fast, played while the ball is on it).
A chevron moves by one slot per loop, the one that enters grows from nothing and the one that leaves shrinks to nothing, so the loop shows no jump."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

FPS = 30
LENGTH = 0.94
WIDTH = 0.7
BELT_WIDTH = 0.56
BASE_H = 0.05
ROLLER_X = 0.4
ROLLER_SIDES = 12
ROLLER_RADIUS = 0.06
ROLLER_Z = BASE_H + ROLLER_RADIUS
BELT_TOP = ROLLER_Z + ROLLER_RADIUS * math.cos(math.pi / ROLLER_SIDES)
RAIL_H = 0.19
CHEVRON_RADIUS = 0.075
SLOTS = [-0.39, -0.3, -0.1, 0.1, 0.3, 0.39]
HIDDEN = 0.001

lpm.reset()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
P = lpm.Palette([
    ("cobalt", "#2456d6", 0.0, 0.55), ("cobalt_dark", "#173a99", 0.0, 0.6), ("cream", "#fff1c9", 0.0, 0.6),
    ("sun", "#ffc61a", 0.0, 0.5), ("graphite", "#2a2d3a", 0.0, 0.7), ("steel", "#9aa6bd", 0.0, 0.4),
])


def frame_parts():
    side = (WIDTH - BELT_WIDTH) / 2
    parts = [
        lpm.box("base", (LENGTH, WIDTH, BASE_H), color=P["cobalt_dark"]),
        lpm.box("belt", (2 * ROLLER_X, BELT_WIDTH, BELT_TOP - BASE_H), at=(0, 0, BASE_H), color=P["graphite"]),
    ]
    for name, sign in (("left", -1), ("right", 1)):
        y = sign * (WIDTH - side) / 2
        parts += [
            lpm.box(f"rail {name}", (LENGTH, side, RAIL_H), at=(0, y, 0.0), color=P["cobalt"]),
            lpm.box(f"rail {name} stripe", (LENGTH - 0.2, side * 0.5, 0.012), at=(0, y, RAIL_H), color=P["cream"]),
        ]
    return parts


def roller_part(x):
    roller = lpm.prism(f"roller {x}", ROLLER_SIDES, ROLLER_RADIUS, BELT_WIDTH, color=P["steel"])
    lpm.rotate(roller, 90, axis="X")
    return lpm.move(roller, dx=x, dy=BELT_WIDTH / 2, dz=ROLLER_Z)


def chevron_part(index):
    return lpm.prism(f"chevron {index}", 3, CHEVRON_RADIUS, 0.01, at=(SLOTS[index], 0, BELT_TOP), color=P["sun"])


def put_origin(ob, point):
    ob.data.transform(lpm.Matrix.Translation((-point[0], -point[1], -point[2])))
    ob.location = point


def clip(ob, name, frames, **channels):
    """One action pushed on its own NLA track, which the glTF export writes as a clip of that name.
    channels: slide=[(fraction of the loop, x, size)] for a chevron, turn=degrees for a roller."""
    first, last = frames
    action = bpy.data.actions.new(f"{name}-{ob.name}")
    ob.animation_data_create().action = action
    if "slide" in channels:
        for fraction, x, size in channels["slide"]:
            ob.location.x = x
            ob.scale = (size, size, size)
            ob.keyframe_insert("location", index=0, frame=first + fraction * (last - first))
            ob.keyframe_insert("scale", frame=first + fraction * (last - first))
    if "turn" in channels:
        for frame, degrees in ((first, 0.0), (last, channels["turn"])):
            ob.rotation_euler = (0.0, math.radians(degrees), 0.0)
            ob.keyframe_insert("rotation_euler", index=1, frame=frame)
    track = ob.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    ob.animation_data.action = None


body = lpm.finish("ConveyorBody", frame_parts(), P, budget=120, ground=False, center=False)
rollers = [lpm.finish(f"ConveyorRoller{index}", [roller_part(x)], P, budget=80, ground=False, center=False) for index, x in enumerate((-ROLLER_X, ROLLER_X))]
chevrons = [lpm.finish(f"ConveyorChevron{index}", [chevron_part(index)], P, budget=20, ground=False, center=False) for index in range(5)]
shared = body.data.materials[0]
for ob in rollers + chevrons:
    spare = ob.data.materials[0]
    ob.data.materials[0] = shared
    bpy.data.materials.remove(spare)

for index, ob in enumerate(rollers):
    put_origin(ob, (ROLLER_X * (2 * index - 1), 0, ROLLER_Z))
for index, ob in enumerate(chevrons):
    put_origin(ob, (SLOTS[index], 0, BELT_TOP + 0.005))
root = bpy.data.objects.new("Conveyor", None)
bpy.context.scene.collection.objects.link(root)
for ob in [body] + rollers + chevrons:
    ob.parent = root
bpy.context.scene.render.fps = FPS


def slide_keys(index):
    """The chevrons stay between the centres of the rollers (|x| <= ROLLER_X) at every moment and all move at the same speed. The one that leaves shrinks away
    before it reaches the end of the belt and waits there; the one that enters grows once its back edge is on the belt."""
    start, end = SLOTS[index], SLOTS[index + 1]
    if index == 4:
        return [(0.0, start, 1.0), (0.5, end, HIDDEN), (1.0, end, HIDDEN)]
    if index == 0:
        return [(0.0, start, HIDDEN), (0.5, start, HIDDEN), (0.75, (start + end) / 2, 1.0), (1.0, end, 1.0)]
    return [(0.0, start, 1.0), (1.0, end, 1.0)]


def loop(name, frames, turn):
    for ob in rollers:
        clip(ob, name, frames, turn=turn)
    for index, ob in enumerate(chevrons):
        clip(ob, name, frames, slide=slide_keys(index))


loop("run", (1, 25), 180.0)
# The last track decides the pose at frame 1, the rest pose of the glTF nodes: `idle` starts with the chevrons on their slots.
loop("idle", (1, 73), 180.0)

bpy.ops.object.select_all(action="DESELECT")
for ob in [root, body] + rollers + chevrons:
    ob.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT) + ".glb", use_selection=True, export_format="GLB", export_animation_mode="NLA_TRACKS")
lpm.save(os.path.abspath(OUT) + ".blend")
