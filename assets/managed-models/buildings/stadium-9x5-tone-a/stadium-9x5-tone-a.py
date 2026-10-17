import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'stadium-9x5-tone-a', 'style': 'urbtopia', 'footprint': (9, 5), 'tones': {'a': {'vtone1': 'brick'}, 'b': {'vtone1': 'cobalt'}, 'c': {'vtone1': 'greygreen'}, 'd': {'vtone1': 'tangerine'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_stadium(SPEC, out_dir)
