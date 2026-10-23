"""Roundabout over 3x3 tiles: a ring road around an open island, four one-tile arms at the middle of each side."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

kit = lib.Kit("road-roundabout")
lib.roundabout(kit, "ENWS")
kit.finish(lib.recipe_out())
