import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import museum_lib  # noqa: E402

SPEC = {'id': 'niteroi-museum-4x4', 'style': 'urbtopia', 'footprint': (4, 4)}
out_dir = os.path.dirname(os.path.abspath(__file__))
museum_lib.build_niteroi(SPEC, out_dir)
