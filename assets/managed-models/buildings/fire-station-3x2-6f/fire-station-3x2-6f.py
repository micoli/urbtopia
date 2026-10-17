import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "fire-station-3x2-6f",
    "kind": "office",
    "style": "urbtopia",
    "footprint": (3, 2),
    "floors": 6,
    "roof": "flat",
    "window_sizes": "same",
    "colors": {
        "wall": "brick",
        "roof": "uslab",
        "trim": "uwall",
        "accent": "sun",
        "door": "udark"
    },
    "wing": None,
    "features": [
        {
            "type": "roller_door",
            "along": -0.3,
            "width": 0.6
        },
        {
            "type": "roller_door",
            "along": 0.3,
            "width": 0.6
        },
        {
            "type": "clock_tower",
            "clock": False
        },
        {
            "type": "sign",
            "text": "fire",
            "placement": "roof"
        }
    ]
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
