import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "school-2x2-6f",
    "kind": "office",
    "style": "urbtopia",
    "footprint": (2, 1.82),
    "floors": 6,
    "roof": "flat",
    "window_sizes": "same",
    "colors": {"roof": "uslab", "trim": "uframe", "accent": "brick"},
    "wing": None,
    "features": [{"type": "clock_tower"}, {"type": "flagpole"}, {"type": "monumental_door"}, {"type": "portico"}, {"type": "sign", "text": "school", "placement": "roof"}, {"type": "bushes"}],
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
