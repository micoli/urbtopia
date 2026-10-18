"""Stick-figure cyclist on a black bicycle riding toward +X; wheels are 0.12 across (one tile is 1.0)."""
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
P = lpm.Palette([("bicycle", "#0d0d0d", 0.0, 0.8), ("rider", "#2b2b2b", 0.0, 0.9)])

WHEEL_RADIUS = 0.06
WHEEL_X = 0.13
BOTTOM_BRACKET = (0, 0, 0.045)
SADDLE = (-0.035, 0, 0.115)
HEAD_TUBE = (0.085, 0, 0.125)
SHOULDER = (0.03, 0, 0.215)
HIP = (-0.04, 0, 0.125)
HANDS = (0.09, 0, 0.145)


def bar(name, start, end, radius, color):
    a, b = Vector(start), Vector(end)
    direction = b - a
    part = lpm.prism(name, 6, radius, direction.length, color=P[color])
    part.data.transform(Matrix.Translation(a) @ direction.to_track_quat("Z", "Y").to_matrix().to_4x4())
    return part


def wheel(name, x):
    profile = [(WHEEL_RADIUS - 0.004, -0.004), (WHEEL_RADIUS + 0.004, -0.004), (WHEEL_RADIUS + 0.004, 0.004), (WHEEL_RADIUS - 0.004, 0.004)]
    tire = lpm.lathe(name, profile, segments=14, at=(x, 0, WHEEL_RADIUS), color=P["bicycle"])
    return lpm.rotate(tire, 90, axis="X", about=(x, 0, WHEEL_RADIUS))


def head(name, center, radius):
    return lpm.prism(name, 8, radius, radius * 2, at=(center[0], center[1], center[2] - radius), color=P["rider"])


rear_hub = (-WHEEL_X, 0, WHEEL_RADIUS)
front_hub = (WHEEL_X, 0, WHEEL_RADIUS)
parts = [
    wheel("rear wheel", -WHEEL_X),
    wheel("front wheel", WHEEL_X),
    bar("seat tube", BOTTOM_BRACKET, SADDLE, 0.0048, "bicycle"),
    bar("top tube", SADDLE, HEAD_TUBE, 0.0048, "bicycle"),
    bar("down tube", BOTTOM_BRACKET, HEAD_TUBE, 0.0048, "bicycle"),
    bar("chain stay", rear_hub, BOTTOM_BRACKET, 0.0036, "bicycle"),
    bar("seat stay", rear_hub, SADDLE, 0.0036, "bicycle"),
    bar("fork", front_hub, HEAD_TUBE, 0.0036, "bicycle"),
    bar("handlebar post", HEAD_TUBE, HANDS[:2] + (0.145,), 0.0036, "bicycle"),
    bar("handlebar", (0.09, -0.025, 0.145), (0.09, 0.025, 0.145), 0.0036, "bicycle"),
    bar("rider torso", HIP, SHOULDER, 0.006, "rider"),
    head("rider head", (0.045, 0, 0.245), 0.022),
    bar("rider arm", SHOULDER, HANDS, 0.0048, "rider"),
    bar("rider thigh", HIP, (0.02, 0, 0.07), 0.006, "rider"),
    bar("rider shin", (0.02, 0, 0.07), (0, 0, 0.035), 0.006, "rider"),
]

model = lpm.finish("BicycleStick", parts, P, budget=500)
lpm.export_glb(model, OUT)
