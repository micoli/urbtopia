import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-5f-banco-a', 'style': 'world', 'footprint': (2, 2), 'floors': 5, 'tier': 8, 'tones': {'a': {'vtone1': 'sandstone', 'vtone2': 'darkwood', 'vtone3': 'aegeanblue'}, 'b': {'vtone1': 'redclay', 'vtone2': 'tarwood', 'vtone3': 'turquoise'}, 'c': {'vtone1': 'plaster', 'vtone2': 'pine', 'vtone3': 'lacquer'}, 'd': {'vtone1': 'dustypink', 'vtone2': 'darkwood', 'vtone3': 'tilegreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_banco(SPEC, out_dir)
