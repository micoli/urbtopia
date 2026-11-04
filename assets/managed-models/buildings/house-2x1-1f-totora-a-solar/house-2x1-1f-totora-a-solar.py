import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x1-1f-totora-a-solar', 'style': 'world', 'footprint': (2, 1), 'floors': 1, 'tier': 2, 'tones': {'a': {'vtone1': 'mosshatch', 'vtone2': 'lacquer', 'vtone3': 'darkwood'}, 'b': {'vtone1': 'strawgold', 'vtone2': 'aegeanblue', 'vtone3': 'tarwood'}, 'c': {'vtone1': 'thatch', 'vtone2': 'tilegreen', 'vtone3': 'darkwood'}, 'd': {'vtone1': 'greythatch', 'vtone2': 'honey', 'vtone3': 'tarwood'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_totora(SPEC, out_dir)
