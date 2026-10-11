import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "house-1x1-4f-mansard-d-solar",
    "kind": "house",
    "style": "kenney",
    "footprint": (1, 1),
    "floors": 4,
    "roof": "mansard",
    "window_sizes": "same",
    "colors": {"wall": "grey", "roof": "greygreen", "accent": "greygreen"},
    "wing": None,
    "features": [{"type": "awning"}, {"type": "bushes"}, {"type": "solar_panels"}],
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
