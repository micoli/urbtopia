import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "nature"))
import pines  # noqa: E402
from model_lib import export_all  # noqa: E402

# The Kenney trees were drawn at 1.5 times the size of these boxes; managed models ignore `scale`, so it is baked in.
BOXES = {
    "tree-small": ((-0.165, -0.18, 0.0), (0.165, 0.18, 0.855)),
    "tree-large": ((-0.165, -0.18, 0.0), (0.165, 0.18, 1.155)),
}

if __name__ == "__main__":
    export_all({
        "tree-small": lambda rng: pines.pine(0.2, 2, 0.2, 0.13, 0.7, "pointed", rng),
        "tree-large": lambda rng: pines.pine(0.25, 3, 0.2, 0.12, 1.0, "pointed", rng),
    }, pines.P, 300, HERE, boxes=BOXES, center=False, ground=False)
