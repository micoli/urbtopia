import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-2f-andean-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 2, 'tier': 5, 'tones': {'a': {'vtone1': 'plaster', 'vtone2': 'aegeanblue', 'vtone3': 'darkwood'}, 'b': {'vtone1': 'ochre', 'vtone2': 'turquoise', 'vtone3': 'pine'}, 'c': {'vtone1': 'sandstone', 'vtone2': 'tilegreen', 'vtone3': 'tarwood'}, 'd': {'vtone1': 'dustypink', 'vtone2': 'lacquer', 'vtone3': 'darkwood'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_andean(SPEC, out_dir)
