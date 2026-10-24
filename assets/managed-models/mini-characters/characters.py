"""Rigged low-poly people for the Venue crowds: twelve customers and the arcade and supermarket employees.

Each model keeps the bone names of the Kenney mini characters (root, leg-left, leg-right, torso, arm-left,
arm-right, head) and the clips src/scene/venueAgents.ts plays: walk, idle, interact-left/right,
holding-both/left/right, pick-up, emote-yes and emote-no. A person faces -y (glTF +z); its left is +x."""
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
from model_lib import fillet, lpm, requested  # noqa: E402

P = lpm.Palette([
    ("skin1", "#f2c9a0", 0.0, 0.8), ("skin2", "#d9a57a", 0.0, 0.8), ("skin3", "#a8714a", 0.0, 0.8), ("skin4", "#6e4630", 0.0, 0.8),
    ("hair_black", "#2a2328", 0.0, 0.9), ("hair_brown", "#6a4126", 0.0, 0.9), ("hair_blond", "#e8c25a", 0.0, 0.9),
    ("hair_red", "#b8482a", 0.0, 0.9), ("hair_grey", "#b9bcc4", 0.0, 0.9),
    ("red", "#e04848", 0.0, 0.8), ("blue", "#4a78c2", 0.0, 0.8), ("green", "#4fa35a", 0.0, 0.8), ("yellow", "#f2c440", 0.0, 0.8),
    ("purple", "#8a5ac8", 0.0, 0.8), ("orange", "#f28a2c", 0.0, 0.8), ("teal", "#3aa8a0", 0.0, 0.8), ("pink", "#e88ab0", 0.0, 0.8),
    ("denim", "#3f5a8a", 0.0, 0.9), ("khaki", "#b8a476", 0.0, 0.9), ("charcoal", "#3c4150", 0.0, 0.9), ("white", "#f2f2f2", 0.0, 0.8),
    ("shoe", "#2a2d3a", 0.0, 0.8), ("eye", "#1c1c22", 0.0, 0.5), ("apron", "#5aae4a", 0.0, 0.9),
])

# (hair, hair style, skin, shirt, trousers) per person; styles: short, curly, long, bun, ponytail, locs, beard.
PEOPLE = {
    "mini-characters/character-female-a": ("hair_brown", "long", "skin1", "red", "denim"),
    "mini-characters/character-female-b": ("hair_black", "bun", "skin3", "yellow", "charcoal"),
    "mini-characters/character-female-c": ("hair_blond", "ponytail", "skin2", "teal", "khaki"),
    "mini-characters/character-female-d": ("hair_red", "long", "skin1", "purple", "denim"),
    "mini-characters/character-female-e": ("hair_black", "curly", "skin4", "orange", "charcoal"),
    "mini-characters/character-female-f": ("hair_grey", "bun", "skin2", "pink", "khaki"),
    "mini-characters/character-male-a": ("hair_black", "short", "skin2", "blue", "khaki"),
    "mini-characters/character-male-b": ("hair_brown", "curly", "skin4", "green", "denim"),
    "mini-characters/character-male-c": ("hair_blond", "locs", "skin1", "orange", "charcoal"),
    "mini-characters/character-male-d": ("hair_brown", "beard", "skin3", "teal", "denim"),
    "mini-characters/character-male-e": ("hair_grey", "short", "skin2", "red", "charcoal"),
    "mini-characters/character-male-f": ("hair_red", "beard", "skin1", "purple", "khaki"),
    "mini-arcade/character-employee": ("hair_black", "cap", "skin3", "purple", "charcoal"),
    "mini-market/character-employee": ("hair_brown", "apron", "skin2", "white", "denim"),
}

# Bone: (head, tail, parent). Arms and legs point down from the shoulder and the hip.
BONES = {
    "root": ((0, 0, 0), (0, 0, 0.12), None),
    "torso": ((0, 0, 0.26), (0, 0, 0.48), "root"),
    "leg-left": ((0.055, 0, 0.26), (0.055, 0, 0.03), "root"),
    "leg-right": ((-0.055, 0, 0.26), (-0.055, 0, 0.03), "root"),
    "arm-left": ((0.135, 0, 0.47), (0.135, 0, 0.3), "torso"),
    "arm-right": ((-0.135, 0, 0.47), (-0.135, 0, 0.3), "torso"),
    "head": ((0, 0, 0.5), (0, 0, 0.76), "torso"),
}


FILLET = 0.012


def bound(ob, bone):
    group = ob.vertex_groups.new(name=bone)
    group.add([v.index for v in ob.data.vertices], 1.0, "REPLACE")
    return ob


def box(name, x0, x1, y0, y1, z0, z1, color, bone, taper=(1.0, 1.0)):
    ob = lpm.box(name, (x1 - x0, y1 - y0, z1 - z0), at=((x0 + x1) / 2, (y0 + y1) / 2, z0), color=P[color], taper=taper)
    if min(x1 - x0, y1 - y0, z1 - z0) >= 0.025:
        fillet(ob, min(FILLET, min(x1 - x0, y1 - y0, z1 - z0) * 0.25))
    return bound(ob, bone)


def hair(style, color, skin):
    parts = []
    if style == "cap":
        parts += [box("cap", -0.14, 0.14, -0.13, 0.13, 0.7, 0.79, "purple", "head"), box("visor", -0.1, 0.1, -0.21, -0.12, 0.7, 0.72, "purple", "head")]
        return parts
    parts.append(box("hair_top", -0.14, 0.14, -0.13, 0.14, 0.72, 0.8, color, "head"))
    parts.append(box("hair_back", -0.14, 0.14, 0.08, 0.14, 0.56 if style in ("long", "curly") else 0.62, 0.8, color, "head"))
    if style in ("long", "curly"):
        for side in (-1, 1):
            x0, x1 = (0.12, 0.16) if side > 0 else (-0.16, -0.12)
            parts.append(box(f"hair_side{side}", x0, x1, -0.08, 0.14, 0.5 if style == "long" else 0.58, 0.78, color, "head"))
    if style == "curly":
        for k in range(5):
            parts.append(box(f"curl{k}", -0.13 + 0.065 * k - 0.03, -0.13 + 0.065 * k + 0.03, -0.1, 0.1, 0.79, 0.83, color, "head"))
    if style == "bun":
        parts.append(box("bun", -0.05, 0.05, 0.04, 0.14, 0.8, 0.88, color, "head"))
    if style == "ponytail":
        parts.append(box("tail", -0.03, 0.03, 0.14, 0.2, 0.52, 0.72, color, "head", taper=(0.7, 1.0)))
    if style == "locs":
        # Dreadlocks: a ring of strands hanging from the sides and the back of the head down to the shoulders.
        strands = [(x, 0.14) for x in (-0.11, -0.055, 0.0, 0.055, 0.11)] + [(side * 0.15, y) for side in (-1, 1) for y in (-0.04, 0.03, 0.1)]
        for k, (x, y) in enumerate(strands):
            length = 0.2 if abs(y) < 0.14 else 0.26
            parts.append(box(f"loc{k}", x - 0.017, x + 0.017, y - 0.017, y + 0.017, 0.78 - length, 0.79, color, "head", taper=(0.8, 0.8)))
    if style == "beard":
        parts.append(box("beard", -0.11, 0.11, -0.14, -0.1, 0.5, 0.6, color, "head"))
    return parts


def person(hair_color, style, skin, shirt, trousers):
    parts = []
    for side, bone in ((1, "leg-left"), (-1, "leg-right")):
        x = side * 0.055
        parts.append(box(f"leg{side}", x - 0.04, x + 0.04, -0.04, 0.04, 0.04, 0.27, trousers, bone))
        parts.append(box(f"shoe{side}", x - 0.045, x + 0.045, -0.08, 0.05, 0.0, 0.05, "shoe", bone))
    parts.append(box("hips", -0.11, 0.11, -0.065, 0.065, 0.24, 0.31, trousers, "torso"))
    parts.append(box("chest", -0.115, 0.115, -0.07, 0.07, 0.31, 0.5, shirt, "torso", taper=(0.92, 0.95)))
    if style == "apron":
        parts.append(box("apron", -0.09, 0.09, -0.08, -0.07, 0.22, 0.46, "apron", "torso"))
    for side, bone in ((1, "arm-left"), (-1, "arm-right")):
        x = side * 0.135
        parts.append(box(f"sleeve{side}", x - 0.03, x + 0.03, -0.03, 0.03, 0.36, 0.49, shirt, bone))
        parts.append(box(f"arm{side}", x - 0.026, x + 0.026, -0.026, 0.026, 0.3, 0.36, skin, bone))
        parts.append(box(f"hand{side}", x - 0.032, x + 0.032, -0.032, 0.032, 0.26, 0.31, skin, bone))
    parts.append(box("neck", -0.04, 0.04, -0.04, 0.04, 0.48, 0.52, skin, "head"))
    parts.append(box("head", -0.13, 0.13, -0.12, 0.13, 0.52, 0.78, skin, "head", taper=(0.95, 0.95)))
    for side in (-1, 1):
        parts.append(box(f"eye{side}", side * 0.05 - 0.018, side * 0.05 + 0.018, -0.13, -0.118, 0.62, 0.66, "eye", "head"))
    parts.append(box("nose", -0.015, 0.015, -0.14, -0.12, 0.58, 0.61, skin, "head"))
    return parts + hair(style, hair_color, skin)


def armature():
    data = bpy.data.armatures.new("rig")
    arm = bpy.data.objects.new("rig", data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, parent) in BONES.items():
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.roll = 0.0
        if parent:
            bone.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm


# Bone rotations in degrees about the bone's local x axis or, as (x, y, z) tuples, about the three local axes;
# "lift" moves the root up. A negative x swings the arms and legs forward, a positive x bends the torso and head forward.
def clips():
    def swing(frames, amplitude, phase=0.0):
        return [math.sin(2 * math.pi * (f / frames) + phase) * amplitude for f in range(frames + 1)]

    walk = {f: {"leg-left": swing(16, 32)[f], "leg-right": -swing(16, 32)[f], "arm-left": -swing(16, 28)[f], "arm-right": swing(16, 28)[f],
                "lift": abs(math.sin(2 * math.pi * f / 16)) * 0.015} for f in range(0, 17, 2)}
    idle = {f: {"torso": math.sin(2 * math.pi * f / 32) * 2, "head": (math.sin(2 * math.pi * f / 32) * 3, 0, math.sin(2 * math.pi * f / 32 + 1) * 6),
                "arm-left": 3 + math.sin(2 * math.pi * f / 32) * 3, "arm-right": 3 - math.sin(2 * math.pi * f / 32) * 3} for f in range(0, 33, 4)}

    def interact(arm):
        return {0: {arm: 0}, 4: {arm: -75}, 8: {arm: -60}, 12: {arm: -75}, 16: {arm: 0}}

    def holding(arms):
        return {0: {a: -80 for a in arms}, 4: {a: -80 for a in arms}}

    return {
        "walk": walk,
        "idle": idle,
        "interact-left": interact("arm-left"),
        "interact-right": interact("arm-right"),
        "holding-both": holding(("arm-left", "arm-right")),
        "holding-left": holding(("arm-left",)),
        "holding-right": holding(("arm-right",)),
        "pick-up": {0: {"torso": 0, "arm-left": 0, "arm-right": 0}, 4: {"torso": 40, "arm-left": -50, "arm-right": -50}, 8: {"torso": 0, "arm-left": 0, "arm-right": 0}},
        "emote-yes": {f: {"head": 18 if f % 8 == 4 else 0, "arm-left": (0, 0, 0) if f in (0, 16) else (0, 0, -150),
                          "arm-right": (0, 0, 0) if f in (0, 16) else (0, 0, 150)} for f in range(0, 17, 4)},
        "emote-no": {f: {"head": (0, 0, 0 if f in (0, 16) else (25 if f % 8 == 4 else -25))} for f in range(0, 17, 4)},
    }


def animate(arm):
    bones = [b for b in BONES if b != "root"]
    arm.animation_data_create()
    for name, frames in clips().items():
        action = bpy.data.actions.new(name)
        arm.animation_data.action = action
        for frame, pose in sorted(frames.items()):
            for bone_name in bones + ["root"]:
                pb = arm.pose.bones[bone_name]
                pb.rotation_mode = "XYZ"
                value = pose.get(bone_name, 0)
                rx, ry, rz = value if isinstance(value, tuple) else (value, 0, 0)
                pb.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
                pb.keyframe_insert("rotation_euler", frame=frame)
            root = arm.pose.bones["root"]
            root.location = (0, 0, 0)
            root.location[1] = pose.get("lift", 0)
            root.keyframe_insert("location", frame=frame)
        action.use_fake_user = True
        track = arm.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, int(min(frames)), action)
        arm.animation_data.action = None


def export(ob, arm, stem):
    os.makedirs(os.path.dirname(stem), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=stem + ".glb", use_selection=True, export_format="GLB", export_animations=True,
                              export_animation_mode="NLA_TRACKS", export_skins=True, export_force_sampling=True)
    lpm.save(stem + ".blend")


if __name__ == "__main__":
    for key in requested(PEOPLE):
        lpm.reset()
        name = os.path.basename(key)
        ob = lpm.finish(name, person(*PEOPLE[key]), P, budget=3000, center=False, ground=False)
        arm = armature()
        ob.parent = arm
        modifier = ob.modifiers.new("rig", "ARMATURE")
        modifier.object = arm
        animate(arm)
        export(ob, arm, os.path.join(ROOT, key, name))
        print(f"[characters] {key}: {lpm.tri_count(ob)} tris")
