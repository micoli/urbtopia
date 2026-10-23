"""Straight road along X, open at W and E."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

kit = lib.Kit("road-straight")
for y0, y1, cell, z in lib.SECTION:
    kit.rect(-0.5, y0, 0.5, y1, z, cell)
kit.skirt()
kit.finish(lib.recipe_out())
