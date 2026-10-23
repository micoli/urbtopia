"""Closed tile with no exit."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

kit = lib.Kit("road-square")
lib.flat_tile(kit, "")
kit.finish(lib.recipe_out())
