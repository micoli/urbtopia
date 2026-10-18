"""Compact low-poly bicycle and seated cyclist for repeated city-scene placement."""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
P = lpm.Palette([
    ("rubber", "#343b43", 0.0, 0.9), ("frame", "#287f83", 0.15, 0.65),
    ("metal", "#9da9a3", 0.55, 0.4), ("seat", "#493b38", 0.0, 0.85),
    ("shirt", "#e06b48", 0.0, 0.8), ("pants", "#385a79", 0.0, 0.85),
    ("skin", "#d99a70", 0.0, 0.85), ("helmet", "#e8bd4d", 0.0, 0.7),
])
parts = []

def add(*objs):
    parts.extend(objs)

def beam(name, start, end, width, depth, color):
    ax, az = start
    bx, bz = end
    dx, dz = bx - ax, bz - az
    length = math.hypot(dx, dz)
    nx, nz = -dz / length * width / 2, dx / length * width / 2
    outline = [(ax + nx, az + nz), (bx + nx, bz + nz), (bx - nx, bz - nz), (ax - nx, az - nz)]
    return lpm.sweep(name, outline, depth, color=P[color])

def wheel(name, x):
    tire = lpm.lathe(name, [(0.405, -0.035), (0.435, -0.035), (0.435, 0.035), (0.405, 0.035)],
                     segments=10, at=(x, 0, 0.45), color=P["rubber"])
    lpm.rotate(tire, 90, axis="X", about=(x, 0, 0.45))
    add(tire)
    hub = lpm.prism(name + " hub", 6, 0.045, 0.07, at=(x, -0.035, 0.45), color=P["metal"])
    lpm.rotate(hub, 90, axis="X", about=(x, 0, 0.45))
    add(hub)
    for index in range(4):
        angle = math.pi * index / 4
        end = (x + math.cos(angle) * 0.39, 0.45 + math.sin(angle) * 0.39)
        add(beam(name + " spoke", (x, 0.45), end, 0.012, 0.025, "metal"))

wheel("rear wheel", -0.55)
wheel("front wheel", 0.55)

# A compact diamond frame, crank and handlebars.
add(beam("seat tube", (-0.16, 0.72), (0.0, 1.03), 0.045, 0.045, "frame"))
add(beam("down tube", (0.0, 1.03), (0.34, 0.70), 0.045, 0.045, "frame"))
add(beam("top tube", (-0.16, 0.72), (0.30, 0.76), 0.04, 0.045, "frame"))
add(beam("rear stay", (-0.55, 0.45), (-0.16, 0.72), 0.03, 0.035, "metal"))
add(beam("chain stay", (-0.55, 0.45), (0.0, 0.45), 0.025, 0.035, "metal"))
add(beam("fork", (0.55, 0.45), (0.34, 0.70), 0.04, 0.045, "frame"))
add(lpm.box("saddle", (0.20, 0.13, 0.045), at=(-0.16, 0, 1.04), color=P["seat"]))
add(beam("handle stem", (0.30, 0.76), (0.34, 1.02), 0.035, 0.04, "metal"))
add(beam("handlebar", (0.34, 1.02), (0.48, 1.02), 0.035, 0.05, "metal"))
add(lpm.prism("crank", 6, 0.06, 0.06, at=(0, -0.04, 0.45), color=P["metal"]))

# Faceted rider: colored torso, simple limbs, hands on the bars and a helmeted head.
add(beam("rider torso", (-0.05, 1.02), (0.24, 1.25), 0.20, 0.15, "shirt"))
add(beam("rider thigh", (-0.02, 1.01), (0.14, 0.77), 0.105, 0.12, "pants"))
add(beam("rider shin", (0.14, 0.77), (0.01, 0.49), 0.075, 0.10, "pants"))
add(beam("rider foot", (0.01, 0.49), (0.12, 0.46), 0.065, 0.10, "seat"))
add(beam("rider upper arm", (0.12, 1.20), (0.34, 1.07), 0.075, 0.10, "shirt"))
add(beam("rider forearm", (0.34, 1.07), (0.45, 1.02), 0.055, 0.08, "skin"))
head = lpm.prism("rider head", 7, 0.115, 0.16, at=(0.26, 0, 1.30), color=P["skin"])
lpm.rotate(head, 90, axis="X", about=(0.26, 0, 1.30))
add(head)
cap = lpm.prism("cycling helmet", 7, 0.13, 0.075, at=(0.26, 0, 1.40), color=P["helmet"])
lpm.rotate(cap, 90, axis="X", about=(0.26, 0, 1.40))
add(cap)

model = lpm.finish("BicycleRider", parts, P, budget=600)
lpm.export_glb(model, OUT)
