import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-victorian-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 3, 'tier': 6, 'tones': {'a': {'vtone1': 'dalablue', 'vtone2': 'whitewash', 'vtone3': 'lacquer'}, 'b': {'vtone1': 'honey', 'vtone2': 'whitewash', 'vtone3': 'tilegreen'}, 'c': {'vtone1': 'dustypink', 'vtone2': 'whitewash', 'vtone3': 'aegeanblue'}, 'd': {'vtone1': 'turquoise', 'vtone2': 'whitewash', 'vtone3': 'lacquer'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_victorian(SPEC, out_dir)
