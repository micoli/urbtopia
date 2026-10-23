"""Elevated deck along Y at 0.5 above the ground, on four slim piers; nothing at ground level."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

ELEVATION = 0.5
THICKNESS = lib.DECK
PIER = 0.07

kit = lib.Kit("road-bridge")
for x0, x1, cell, z in lib.SECTION:
    kit.rect(x0, -0.5, x1, 0.5, ELEVATION + z, cell)
bottom = ELEVATION + lib.Z_FLAT - THICKNESS
kit.skirt(THICKNESS)
kit.poly([(-0.5, -0.5, bottom), (0.5, -0.5, bottom), (0.5, 0.5, bottom), (-0.5, 0.5, bottom)], "side", (0, 0, -1))
for x in (-0.44, 0.44):
    for y in (-0.44, 0.44):
        lib.box(kit, x - PIER / 2, y - PIER / 2, 0, x + PIER / 2, y + PIER / 2, bottom, "side")
kit.finish(lib.recipe_out())
