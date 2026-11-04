import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-1f-maloca-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 1, 'tones': {'a': {'vtone1': 'thatch', 'vtone2': 'pine', 'vtone3': 'lacquer'}, 'b': {'vtone1': 'strawgold', 'vtone2': 'darkwood', 'vtone3': 'aegeanblue'}, 'c': {'vtone1': 'greythatch', 'vtone2': 'tarwood', 'vtone3': 'honey'}, 'd': {'vtone1': 'mosshatch', 'vtone2': 'pine', 'vtone3': 'lacquer'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_maloca(SPEC, out_dir)
