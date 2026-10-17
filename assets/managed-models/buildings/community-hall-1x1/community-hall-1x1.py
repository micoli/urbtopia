import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "community-hall-1x1", "kind": "house", "style": "urbtopia", "footprint": (1, 1.0), "floors": 1, "roof": "gable_half", "window_sizes": "same", "colors": {"wall": "cream", "roof": "uroof", "trim": "uframe", "accent": "coral"}, "wing": None, "features": [{"type": "monumental_door"}, {"type": "flagpole"}, {"type": "sign", "text": "hall"}, {"type": "bushes"}]}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
