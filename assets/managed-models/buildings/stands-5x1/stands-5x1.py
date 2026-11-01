import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import pirate_kit  # noqa: E402

pirate_kit.stands(5, 1, 5, __file__, "Stands5x1", canopy=True)
