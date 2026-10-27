"""Footbridge corridor: a flat tile open on the west, east and south edges, closed by a rail on the north edge."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import footbridge_lib as fb
import street_lib as lib

kit = lib.Kit("footbridge-corridor")
fb.corridor(kit)
kit.finish(lib.recipe_out())
