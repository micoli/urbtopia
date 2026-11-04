import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x1-1f-queenslander-a', 'style': 'world', 'footprint': (1, 1), 'floors': 1, 'tier': 1, 'tones': {'a': {'vtone1': 'plaster', 'vtone2': 'lacquer', 'vtone3': 'whitewash'}, 'b': {'vtone1': 'dalablue', 'vtone2': 'tilegreen', 'vtone3': 'whitewash'}, 'c': {'vtone1': 'honey', 'vtone2': 'kawara', 'vtone3': 'whitewash'}, 'd': {'vtone1': 'pastelpink', 'vtone2': 'kawara_blue', 'vtone3': 'whitewash'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_queenslander(SPEC, out_dir)
