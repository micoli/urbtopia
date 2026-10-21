import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'colosseum-5x5', 'style': 'urbtopia', 'footprint': (5, 5)}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_colosseum(SPEC, out_dir)
