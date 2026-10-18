"""Red four-door sedan, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("body", "#d93a2f")]
P = kit.palette(COLORS)

parts = kit.passenger(P, "body", length=2.56)

kit.build("Sedan", parts, COLORS, OUT, budget=1600)
