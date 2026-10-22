import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'padel-3x3', 'style': 'urbtopia', 'footprint': (3, 3)}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_padel(SPEC, out_dir)
