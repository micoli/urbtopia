"""Footbridge stair entered from the north edge: a flight south to a landing, then a flight east up to the deck."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import footbridge_lib as fb
import street_lib as lib

kit = lib.Kit("footbridge-stair-left")
fb.stair(kit, mirror=False)
kit.finish(lib.recipe_out())
