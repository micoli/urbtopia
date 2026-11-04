import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x2-3f-swahili-a-solar', 'style': 'world', 'footprint': (1, 2), 'floors': 3, 'tones': {'a': {'vtone1': 'whitewash', 'vtone2': 'darkwood', 'vtone3': 'aegeanblue'}, 'b': {'vtone1': 'ochre', 'vtone2': 'tarwood', 'vtone3': 'tilegreen'}, 'c': {'vtone1': 'sandstone', 'vtone2': 'pine', 'vtone3': 'turquoise'}, 'd': {'vtone1': 'dustypink', 'vtone2': 'darkwood', 'vtone3': 'lacquer'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_swahili(SPEC, out_dir)
