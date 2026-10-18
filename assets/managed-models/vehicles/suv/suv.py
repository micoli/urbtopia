"""Green SUV with roof rack, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("body", "#2f9a4a")]
P = kit.palette(COLORS)

parts = kit.passenger(P, "body", length=2.7, width=1.5, zs=0.84, lift=0.06, wheel_r=0.33, axle=0.88, roof_h=0.5, cabin=(-0.52, 1.22, -0.22, 1.18), rack=True, cladding=True, hood_drop=0.04, trunk_drop=0.0)

kit.build("Suv", parts, COLORS, OUT, budget=1900)
