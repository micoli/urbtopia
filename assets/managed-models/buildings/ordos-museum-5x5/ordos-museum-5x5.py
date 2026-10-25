import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import museum_lib  # noqa: E402

SPEC = {'id': 'ordos-museum-5x5', 'style': 'urbtopia', 'footprint': (5, 5)}
out_dir = os.path.dirname(os.path.abspath(__file__))
museum_lib.build_ordos(SPEC, out_dir)
