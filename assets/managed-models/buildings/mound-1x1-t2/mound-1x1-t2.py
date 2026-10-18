import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "mound-1x1-t2", "style": "urbtopia", "footprint": (1, 1), "count": 2}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_mound(SPEC, out_dir)
