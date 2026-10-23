"""Quarter turn, open at W and S: bands of a ring around the SW corner of the tile."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

STEPS = 8
kit = lib.Kit("road-bend")
radii = [(0.0, 0.1, "curb", lib.Z_CURB), (0.1, 0.2, "gutter", lib.Z_FLAT), (0.2, 0.49, "road", lib.Z_FLAT), (0.49, 0.51, "line", lib.Z_FLAT), (0.51, 0.8, "road", lib.Z_FLAT), (0.8, 0.9, "gutter", lib.Z_FLAT), (0.9, 1.0, "curb", lib.Z_CURB)]
for inner, outer, cell, z in radii:
    b = lib.arc(-0.5, -0.5, outer, 0, 90, STEPS, z)
    if inner == 0:
        for i in range(STEPS):
            kit.poly([(-0.5, -0.5, z), b[i], b[i + 1]], cell)
        continue
    kit.strip(lib.arc(-0.5, -0.5, inner, 0, 90, STEPS, z), b, z, cell)
kit.skirt()
kit.finish(lib.recipe_out())
