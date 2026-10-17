import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {"id": "stop-1x1-brt", "style": "urbtopia", "footprint": (1, 1), "kind": "brt"}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_stop(SPEC, out_dir)
