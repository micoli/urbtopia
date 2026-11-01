import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "library-4x2", "kind": "office", "style": "urbtopia", "footprint": (4, 1.78), "floors": 2, "roof": "flat", "window_sizes": "same", "colors": {"wall": "uwall", "roof": "uslab", "trim": "utrim", "accent": "uroof"}, "wing": None, "features": [{"type": "colonnade", "columns": 8, "width": 1.9, "text": "LIBRARY"}, {"type": "raised_center", "ratio": 0.5}, {"type": "barrel_wings", "inner": 0.5, "rise": 0.17}, {"type": "dome", "radius": 0.44, "drum": 0.13, "ring": True}, {"type": "cypresses", "per_side": 3, "span": 1.9}, {"type": "bushes"}]}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
