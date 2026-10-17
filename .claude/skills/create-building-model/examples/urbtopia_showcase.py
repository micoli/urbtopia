"""Showcase of the "urbtopia" style: houses, a school, industry and downtown buildings in one run.

  python tools/blender/bl.py --script .claude/skills/create-building-model/examples/urbtopia_showcase.py -- --out <dir>

Writes <id>.blend and <id>.glb for every building into <dir>. Render them together with
scripts/game_render.py (comma-separated --input) to compare them under the game's light.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "scripts"))
import building_lib  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1] if "--out" in argv else os.path.join(HERE, "_out")
os.makedirs(OUT, exist_ok=True)

BASE = {"style": "urbtopia", "window_sizes": "same", "wing": None}
SPECS = [
    {"id": "urb-house-gable", "kind": "house", "footprint": (1, 1), "floors": 1, "roof": "gable_half", "colors": {}, "features": [{"type": "chimney"}]},
    {"id": "urb-house-2f", "kind": "house", "footprint": (1, 1), "floors": 2, "roof": "gable_half", "colors": {}, "features": []},
    {"id": "urb-house-l", "kind": "house", "footprint": (2, 1), "floors": 1, "roof": "gable_cross", "colors": {"wall": "uwall"},
     "wing": {"side": "left", "width": 0.8, "depth_ratio": 0.7, "floors": 1, "roof": "gable_half", "garage": True},
     "features": [{"type": "chimney"}, {"type": "awning"}, {"type": "bushes"}]},
    {"id": "urb-school", "kind": "office", "footprint": (2, 2), "floors": 2, "roof": "flat",
     "colors": {"roof": "udark", "trim": "uframe", "accent": "brick"},
     "features": [{"type": "clock_tower"}, {"type": "flagpole"}, {"type": "monumental_door"}, {"type": "bushes"}]},
    {"id": "urb-factory", "kind": "office", "footprint": (3, 2), "floors": 1, "roof": "sawtooth",
     "colors": {"wall": "uwall", "roof": "udark", "trim": "utrim", "accent": "sun", "door": "udark"},
     "features": [{"type": "roller_door", "along": -0.3}, {"type": "smokestack"}]},
    {"id": "urb-warehouse", "kind": "office", "footprint": (3, 2), "floors": 1, "roof": "gable_half",
     "colors": {"wall": "uwall", "roof": "udark", "trim": "utrim", "accent": "brick"},
     "features": [{"type": "roller_door", "along": -0.3}, {"type": "roller_door", "along": 0.3}]},
    {"id": "urb-shop", "kind": "apartment", "footprint": (1, 1), "floors": 3, "roof": "flat",
     "colors": {"wall": "salmon", "accent": "brick", "roof": "udark"}, "features": [{"type": "storefront"}, {"type": "awning"}, {"type": "sign", "text": "cafe"}]},
    {"id": "urb-shop-l", "kind": "apartment", "footprint": (2, 1), "floors": 4, "roof": "flat",
     "colors": {"wall": "cream", "accent": "uroof", "roof": "udark"}, "wing": {"side": "right", "width": 0.7, "depth_ratio": 1.0, "floors": 2, "roof": "flat"},
     "features": [{"type": "storefront"}, {"type": "awning"}, {"type": "sign", "text": "shop"}]},
    {"id": "urb-apartments", "kind": "apartment", "footprint": (2, 1), "floors": 5, "roof": "flat",
     "colors": {"wall": "paleblue", "accent": "utrim", "roof": "udark"}, "features": [{"type": "balcony"}, {"type": "penthouse"}]},
    {"id": "urb-tower", "kind": "office", "footprint": (2, 2), "floors": 8, "roof": "flat",
     "colors": {"wall": "uframe", "trim": "utrim", "roof": "udark"}, "features": [{"type": "penthouse"}, {"type": "antenna"}]},
    {"id": "urb-hotel", "kind": "apartment", "footprint": (2, 2), "floors": 6, "roof": "flat",
     "colors": {"wall": "greygreen", "accent": "sun", "roof": "udark", "trim": "uwall"},
     "features": [{"type": "storefront"}, {"type": "awning"}, {"type": "sign", "text": "hotel", "placement": "roof"}]},
    {"id": "urb-slim", "kind": "apartment", "footprint": (1, 1), "floors": 7, "roof": "flat",
     "colors": {"wall": "bluegrey", "accent": "brick", "roof": "udark", "trim": "uwall"}, "features": [{"type": "vent"}, {"type": "balcony"}]},
]

for spec in SPECS:
    building_lib.build({**BASE, **spec}, OUT)
