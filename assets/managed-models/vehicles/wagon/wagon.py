"""Purple station wagon with roof rack, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("body", "#5b3fc4")]
P = kit.palette(COLORS)

parts = kit.passenger(P, "body", length=2.85, width=1.5, zs=0.78, lift=0.03, wheel_r=0.31, axle=0.92, roof_h=0.48, cabin=(-0.55, 1.35, -0.2, 1.3), rack=True, trunk_drop=0.0)

kit.build("Wagon", parts, COLORS, OUT, budget=1900)
