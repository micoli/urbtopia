"""Small yellow city car with a black roof (taxi), front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("body", "#f2b81c")]
P = kit.palette(COLORS)

parts = kit.passenger(P, "body", length=2.2, width=1.4, zs=0.68, roof_h=0.56, cabin=(-0.34, 0.92, 0.0, 0.86), roof="trim", wheel_r=0.28, axle=0.7, trunk_drop=0.0)

kit.build("CityCar", parts, COLORS, OUT, budget=1600)
