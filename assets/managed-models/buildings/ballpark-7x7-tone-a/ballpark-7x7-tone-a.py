import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'ballpark-7x7-tone-a', 'style': 'urbtopia', 'footprint': (7, 7), 'tones': {'a': {'vtone1': 'brick', 'vtone2': 'navy', 'vtone3': 'cobalt'}, 'b': {'vtone1': 'cobalt', 'vtone2': 'graphite', 'vtone3': 'sky'}, 'c': {'vtone1': 'greygreen', 'vtone2': 'slate_dark', 'vtone3': 'cobalt'}, 'd': {'vtone1': 'tangerine', 'vtone2': 'navy', 'vtone3': 'cobalt'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_ballpark(SPEC, out_dir)
