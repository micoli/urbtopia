"""Roundabout over 3x3 tiles with three arms, open at W, E and S like the T junction; the north side stays closed."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

kit = lib.Kit("road-roundabout-three")
lib.roundabout(kit, "EWS")
kit.finish(lib.recipe_out())
