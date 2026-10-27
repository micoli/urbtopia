"""Footbridge deck: a walkway along X at 0.5 above the ground with a rail on each side and four slim piers."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import footbridge_lib as fb
import street_lib as lib

kit = lib.Kit("footbridge-deck")
fb.deck(kit)
kit.finish(lib.recipe_out())
