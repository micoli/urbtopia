import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import model_lib  # noqa: E402
from model_lib import lpm, requested  # noqa: E402, F401

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def export_all(models, palette, budget, **finish):
    model_lib.export_all(models, palette, budget, OUT_DIR, **finish)
