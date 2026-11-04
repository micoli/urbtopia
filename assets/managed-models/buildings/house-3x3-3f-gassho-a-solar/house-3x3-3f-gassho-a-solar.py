import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-3x3-3f-gassho-a-solar', 'solar': True, 'style': 'world', 'footprint': (3, 3), 'floors': 3, 'tier': 9, 'tones': {'a': {'vtone1': 'thatch', 'vtone2': 'tarwood', 'vtone3': 'plaster'}, 'b': {'vtone1': 'strawgold', 'vtone2': 'greywood', 'vtone3': 'whitewash'}, 'c': {'vtone1': 'greythatch', 'vtone2': 'darkwood', 'vtone3': 'plaster'}, 'd': {'vtone1': 'mosshatch', 'vtone2': 'pine', 'vtone3': 'cream'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_gassho(SPEC, out_dir)
