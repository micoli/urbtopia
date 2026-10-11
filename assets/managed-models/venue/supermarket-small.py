"""Half-width variant of the low-poly supermarket."""

import os
import runpy
import sys


args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = args[args.index("--out") + 1]
sys.argv = [sys.argv[0], "--", "--out", out, "--width-scale", "0.5"]
runpy.run_path(os.path.join(os.path.dirname(__file__), "supermarket.py"), run_name="__main__")
