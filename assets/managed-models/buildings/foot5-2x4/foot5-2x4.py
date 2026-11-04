import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'foot5-2x4', 'style': 'urbtopia', 'footprint': (2, 4)}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_football_pitch(SPEC, out_dir)
