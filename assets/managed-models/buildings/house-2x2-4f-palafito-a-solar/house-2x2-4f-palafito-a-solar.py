import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-4f-palafito-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 4, 'tier': 7, 'tones': {'a': {'vtone1': 'honey', 'vtone2': 'whitewash', 'vtone3': 'lacquer'}, 'b': {'vtone1': 'dalablue', 'vtone2': 'whitewash', 'vtone3': 'kawara'}, 'c': {'vtone1': 'redclay', 'vtone2': 'whitewash', 'vtone3': 'tilegreen'}, 'd': {'vtone1': 'turquoise', 'vtone2': 'whitewash', 'vtone3': 'kawara_blue'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_palafito(SPEC, out_dir)
