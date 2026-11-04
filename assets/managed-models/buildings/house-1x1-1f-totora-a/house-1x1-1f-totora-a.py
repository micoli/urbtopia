import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x1-1f-totora-a', 'style': 'world', 'footprint': (1, 1), 'floors': 1, 'tier': 1, 'tones': {'a': {'vtone1': 'strawgold', 'vtone2': 'lacquer', 'vtone3': 'darkwood'}, 'b': {'vtone1': 'thatch', 'vtone2': 'aegeanblue', 'vtone3': 'tarwood'}, 'c': {'vtone1': 'greythatch', 'vtone2': 'tilegreen', 'vtone3': 'darkwood'}, 'd': {'vtone1': 'honey', 'vtone2': 'turquoise', 'vtone3': 'tarwood'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_totora(SPEC, out_dir)
