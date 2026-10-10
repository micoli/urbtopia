import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "house-1x1-1f-mansard-a",
    "kind": "house",
    "style": "kenney",
    "footprint": (1, 1),
    "floors": 1,
    "roof": "mansard",
    "window_sizes": "same",
    "colors": {"roof": "cobalt"},
    "wing": None,
    "features": [{"type": "awning"}, {"type": "bushes"}],
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
