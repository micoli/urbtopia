import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "library-2x2", "kind": "office", "style": "urbtopia", "footprint": (2, 1.78), "floors": 2, "roof": "flat", "window_sizes": "same", "colors": {"wall": "uwall", "roof": "uslab", "trim": "utrim", "accent": "uroof"}, "wing": None, "features": [{"type": "colonnade", "columns": 4, "text": "LIBRARY"}, {"type": "dome", "radius": 0.3}, {"type": "bushes"}]}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
