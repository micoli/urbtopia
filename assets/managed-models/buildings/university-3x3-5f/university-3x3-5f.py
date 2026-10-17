import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "university-3x3-5f",
    "kind": "office",
    "style": "urbtopia",
    "footprint": (3, 2.82),
    "floors": 5,
    "roof": "flat",
    "window_sizes": "same",
    "colors": {
        "wall": "cream",
        "roof": "uslab",
        "trim": "uframe",
        "accent": "brick"
    },
    "wing": None,
    "features": [
        {
            "type": "portico"
        },
        {
            "type": "clock_tower"
        },
        {
            "type": "flagpole"
        },
        {
            "type": "monumental_door"
        },
        {
            "type": "sign",
            "text": "university",
            "placement": "roof"
        },
        {
            "type": "bushes"
        }
    ]
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
