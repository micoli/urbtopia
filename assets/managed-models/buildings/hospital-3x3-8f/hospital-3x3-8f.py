import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "hospital-3x3-8f",
    "kind": "office",
    "style": "urbtopia",
    "footprint": (3, 2.82),
    "floors": 8,
    "roof": "flat",
    "window_sizes": "same",
    "colors": {
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
            "type": "penthouse"
        },
        {
            "type": "red_cross",
            "along": 0.3
        },
        {
            "type": "sign",
            "text": "hospital",
            "placement": "roof"
        },
        {
            "type": "bushes"
        }
    ]
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
