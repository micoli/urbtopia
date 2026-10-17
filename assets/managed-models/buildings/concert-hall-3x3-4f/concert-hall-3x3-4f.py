import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "concert-hall-3x3-4f", "kind": "office", "style": "urbtopia", "footprint": (3, 2.82), "floors": 4, "roof": "flat", "window_sizes": "same", "colors": {"wall": "paleblue", "roof": "uslab", "trim": "uframe", "accent": "magenta"}, "wing": None, "features": [{"type": "portico"}, {"type": "penthouse"}, {"type": "sign", "text": "concert", "placement": "roof"}, {"type": "bushes"}]}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
