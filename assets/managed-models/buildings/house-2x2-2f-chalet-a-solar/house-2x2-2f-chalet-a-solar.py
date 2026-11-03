import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-2f-chalet-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 2, 'tier': 5, 'solar': True, 'tones': {'a': {'vtone1': 'pine', 'vtone2': 'grey', 'vtone3': 'shingle'}, 'b': {'vtone1': 'darkwood', 'vtone2': 'grey', 'vtone3': 'slate_dark'}, 'c': {'vtone1': 'honey', 'vtone2': 'limestone', 'vtone3': 'shingle'}, 'd': {'vtone1': 'greywood', 'vtone2': 'grey', 'vtone3': 'shingle'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_chalet(SPEC, out_dir)
