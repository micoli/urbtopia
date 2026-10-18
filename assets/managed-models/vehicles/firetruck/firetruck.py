"""Red fire truck with a roof ladder, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import vehicle_kit as kit  # noqa: E402
import service_kit  # noqa: E402
import lpm  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.splitext(__file__)[0]

lpm.reset()
COLORS = [("blue", "#2f5fe0"), ("body", "#d6342c")]
P = kit.palette(COLORS)

kit.build("Firetruck", service_kit.firetruck(P), COLORS, OUT, budget=2300)
