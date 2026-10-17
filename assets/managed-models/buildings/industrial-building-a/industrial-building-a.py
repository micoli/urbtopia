import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "industrial-building-a",
    "kind": "office",
    "style": "urbtopia",
    "footprint": (2, 2),
    "floors": 2,
    "floor_height_scale": 1.35,
    "roof": "flat",
    "window_sizes": "same",
    "colors": {"wall": "uwall", "roof": "uslab", "trim": "uframe", "accent": "tangerine", "door": "udark"},
    "wing": None,
    "features": [
        {"type": "roller_door", "along": 0.0, "width": 0.7},
        {"type": "loading_dock", "along": 0.0, "width": 0.82},
        {"type": "industrial_door", "face": "back", "along": 0.0, "width": 0.8},
        {"type": "sign", "text": "STORE", "placement": "roof", "lift": 0.08},
    ],
    "door_along": -0.55,
    "roof_overhang": 0.01,
    "slab_matches_plinth": True,
    "roof_deck": "offwhite",
    "floor_bands": False,
    "auto_windows": ["left", "right"],
    "extra_windows": [],
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
