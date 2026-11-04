import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-4f-tuscan-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 4, 'tier': 7, 'solar': True, 'tones': {'a': {'vtone1': 'ochre', 'vtone2': 'limestone', 'vtone3': 'tile'}, 'b': {'vtone1': 'siena', 'vtone2': 'limestone', 'vtone3': 'tile'}, 'c': {'vtone1': 'cream', 'vtone2': 'limestone', 'vtone3': 'tile'}, 'd': {'vtone1': 'dustypink', 'vtone2': 'limestone', 'vtone3': 'tile'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_tuscan(SPEC, out_dir)
