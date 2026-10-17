import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'vault-2x1-t4-tone-a', 'style': 'urbtopia', 'footprint': (2, 1), 'count': 4, 'tones': {'a': {'vtone1': 'uroof'}, 'b': {'vtone1': 'tangerine'}, 'c': {'vtone1': 'sky'}, 'd': {'vtone1': 'brick'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_vault(SPEC, out_dir)
