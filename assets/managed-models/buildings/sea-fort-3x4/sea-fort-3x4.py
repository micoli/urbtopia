import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import pirate_kit  # noqa: E402

pirate_kit.fort(3, 4, __file__, "SeaFort3x4")
