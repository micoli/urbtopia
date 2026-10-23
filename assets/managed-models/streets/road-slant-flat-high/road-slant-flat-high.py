"""Slim ramp along X, flat at -X, rising to 0.5 at +X; the height follows a cubic Bezier with flat ends (smoothstep), so it enters and leaves flat."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import street_lib as lib

STEPS = 8
RISE = 0.5
THICKNESS = lib.DECK

kit = lib.Kit("road-slant-flat-high")
xs = [-0.5 + k / STEPS for k in range(STEPS + 1)]
rise = [RISE * lib.smoothstep(k / STEPS) for k in range(STEPS + 1)]
for y0, y1, cell, z in lib.SECTION:
    for i in range(STEPS):
        kit.poly([(xs[i], y0, z + rise[i]), (xs[i + 1], y0, z + rise[i + 1]), (xs[i + 1], y1, z + rise[i + 1]), (xs[i], y1, z + rise[i])], cell)
kit.skirt(THICKNESS)
kit.poly([(x, y, lib.Z_FLAT + r - THICKNESS) for y in (-0.5, 0.5) for x, r in zip(xs, rise)][:STEPS + 1] + [(x, 0.5, lib.Z_FLAT + r - THICKNESS) for x, r in zip(reversed(xs), reversed(rise))], "side", (0, 0, -1))
kit.finish(lib.recipe_out())
