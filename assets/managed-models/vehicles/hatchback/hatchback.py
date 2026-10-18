"""Blue hatchback with a tall rear, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("body", "#2f62d6")]
P = kit.palette(COLORS)

parts = kit.passenger(P, "body", length=2.3, width=1.44, zs=0.7, roof_h=0.52, cabin=(-0.4, 1.0, -0.06, 0.92), wheel_r=0.29, axle=0.74, trunk_drop=0.0)

kit.build("Hatchback", parts, COLORS, OUT, budget=1600)
