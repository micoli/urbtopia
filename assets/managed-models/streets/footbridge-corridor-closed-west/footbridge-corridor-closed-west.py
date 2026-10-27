"""Footbridge corridor the walkway of the corridor stops at the line of the stair on its west side, and the rail of the stair goes straight on along it."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import footbridge_lib as fb
import street_lib as lib

kit = lib.Kit("footbridge-corridor-closed-west")
fb.corridor(kit, closed="W")
kit.finish(lib.recipe_out())
