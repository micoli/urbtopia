import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "theater-2x2-5f", "kind": "office", "style": "urbtopia", "footprint": (2, 1.82), "floors": 5, "roof": "flat", "window_sizes": "same", "colors": {"wall": "salmon", "roof": "uslab", "trim": "uframe", "accent": "violet"}, "wing": None, "features": [{"type": "portico"}, {"type": "penthouse"}, {"type": "sign", "text": "theater", "placement": "roof"}, {"type": "bushes"}]}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
