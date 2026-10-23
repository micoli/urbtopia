"""Straight road along X with a zebra crossing in the middle."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

L = lib.LINE
kit = lib.Kit("road-crossing")
bars = [(-0.1, y0, 0.1, y0 + 0.1) for y0 in (-0.25, -0.05, 0.15)]
edges = [(-0.13, -0.3, -0.11, 0.3), (0.11, -0.3, 0.13, 0.3)]
lib.flat_tile(kit, "WE", lines=[(-0.5, -L, -0.13, L), (0.13, -L, 0.5, L), *edges], bars=bars)
kit.finish(lib.recipe_out())
