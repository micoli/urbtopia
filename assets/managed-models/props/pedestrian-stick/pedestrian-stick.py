"""Stick-figure pedestrian walking toward +X, 0.30 tall (one tile is 1.0)."""
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
P = lpm.Palette([("figure", "#2b2b2b", 0.0, 0.9)])


def bar(name, start, end, radius):
    a, b = Vector(start), Vector(end)
    direction = b - a
    part = lpm.prism(name, 6, radius, direction.length, color=P["figure"])
    part.data.transform(Matrix.Translation(a) @ direction.to_track_quat("Z", "Y").to_matrix().to_4x4())
    return part


def head(name, center, radius):
    part = lpm.prism(name, 8, radius, radius * 2, at=(center[0], center[1], center[2] - radius), color=P["figure"])
    return part


parts = [
    head("head", (0, 0, 0.275), 0.025),
    bar("torso", (0, 0, 0.255), (0, 0, 0.15), 0.006),
    bar("arm front", (0, 0, 0.245), (0.04, 0, 0.17), 0.0048),
    bar("arm back", (0, 0, 0.245), (-0.04, 0, 0.17), 0.0048),
    bar("leg front", (0, 0, 0.15), (0.05, 0, 0), 0.006),
    bar("leg back", (0, 0, 0.15), (-0.05, 0, 0), 0.006),
]

model = lpm.finish("PedestrianStick", parts, P, budget=200)
lpm.export_glb(model, OUT)
