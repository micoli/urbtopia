import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "house-2x2-1f-mansard-b",
    "kind": "house",
    "style": "kenney",
    "footprint": (2, 2),
    "floors": 1,
    "roof": "mansard",
    "window_sizes": "same",
    "colors": {"wall": "bluegrey", "roof": "softgreen"},
    "wing": None,
    "features": [{"type": "awning"}, {"type": "bushes"}],
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
