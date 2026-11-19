import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "planning-office-2x2-2f", "kind": "office", "style": "urbtopia", "footprint": (2, 2), "floors": 2, "roof": "flat", "window_sizes": "same", "colors": {"wall": "uwall", "roof": "uslab", "trim": "utrim", "accent": "uroof"}, "wing": None, "features": [{"type": "awning"}, {"type": "sign", "text": "PLANNING", "placement": "roof"}, {"type": "vent", "count": 3, "scale": 2.2, "spacing": 0.3, "cap": "uroof"}, {"type": "bushes"}]}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
