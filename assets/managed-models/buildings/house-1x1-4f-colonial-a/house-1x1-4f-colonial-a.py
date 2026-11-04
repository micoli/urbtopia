import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x1-4f-colonial-a', 'style': 'world', 'footprint': (1, 1), 'floors': 4, 'tones': {'a': {'vtone1': 'honey', 'vtone2': 'darkwood', 'vtone3': 'tilegreen'}, 'b': {'vtone1': 'pastelpink', 'vtone2': 'tarwood', 'vtone3': 'aegeanblue'}, 'c': {'vtone1': 'turquoise', 'vtone2': 'darkwood', 'vtone3': 'lacquer'}, 'd': {'vtone1': 'plaster', 'vtone2': 'pine', 'vtone3': 'majorelle'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_colonial(SPEC, out_dir)
