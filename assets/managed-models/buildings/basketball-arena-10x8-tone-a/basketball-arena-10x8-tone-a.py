import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'basketball-arena-10x8-tone-a', 'style': 'urbtopia', 'footprint': (10, 8), 'tones': {'a': {'vtone1': 'sky'}, 'b': {'vtone1': 'brick'}, 'c': {'vtone1': 'greygreen'}, 'd': {'vtone1': 'violet'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_basketball_arena(SPEC, out_dir)
