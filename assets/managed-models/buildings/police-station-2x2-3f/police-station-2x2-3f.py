import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "police-station-2x2-3f",
    "kind": "office",
    "style": "urbtopia",
    "footprint": (2, 1.82),
    "floors": 3,
    "roof": "flat",
    "window_sizes": "same",
    "colors": {
        "wall": "paleblue",
        "roof": "uslab",
        "trim": "uframe",
        "accent": "navy"
    },
    "wing": None,
    "features": [
        {
            "type": "portico"
        },
        {
            "type": "flagpole"
        },
        {
            "type": "monumental_door"
        },
        {
            "type": "sign",
            "text": "police",
            "placement": "roof"
        },
        {
            "type": "bushes"
        }
    ]
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
