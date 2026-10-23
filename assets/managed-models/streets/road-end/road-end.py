"""Dead end, open at E."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

kit = lib.Kit("road-end")
lib.flat_tile(kit, "E", lines=[(0, -lib.LINE, 0.5, lib.LINE)])
kit.finish(lib.recipe_out())
