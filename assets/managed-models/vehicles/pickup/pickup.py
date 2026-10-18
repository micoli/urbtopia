"""White double-cab pickup, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("body", "#e9eaf2")]
P = kit.palette(COLORS)

parts = kit.passenger(P, "body", length=3.0, width=1.5, zs=0.86, lift=0.08, wheel_r=0.33, axle=0.95, roof_h=0.5, cabin=(-0.66, 0.3, -0.36, 0.2), bed=True, cladding=True, hood_drop=0.04)

kit.build("Pickup", parts, COLORS, OUT, budget=1900)
