"""Four-way junction."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

L = lib.LINE
kit = lib.Kit("road-crossroad")
lib.flat_tile(kit, "NESW", lines=[(-0.5, -L, -0.36, L), (0.36, -L, 0.5, L), (-L, -0.5, L, -0.36), (-L, 0.36, L, 0.5)])
kit.finish(lib.recipe_out())
