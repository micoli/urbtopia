"""Footbridge corridor: a flat walkway as wide as the stairs, open on the west, east and south edges, with a rail on each side."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import footbridge_lib as fb
import street_lib as lib

kit = lib.Kit("footbridge-corridor")
fb.corridor(kit)
kit.finish(lib.recipe_out())
