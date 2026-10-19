import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'football-stadium-12x9-tone-a', 'style': 'urbtopia', 'footprint': (12, 9), 'tones': {'a': {'vtone1': 'sky'}, 'b': {'vtone1': 'brick'}, 'c': {'vtone1': 'greygreen'}, 'd': {'vtone1': 'tangerine'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_football_stadium(SPEC, out_dir)
