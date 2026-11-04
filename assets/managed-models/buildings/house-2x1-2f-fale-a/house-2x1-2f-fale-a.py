import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x1-2f-fale-a', 'style': 'world', 'footprint': (2, 1), 'floors': 2, 'tier': 3, 'tones': {'a': {'vtone1': 'thatch', 'vtone2': 'pine', 'vtone3': 'lacquer'}, 'b': {'vtone1': 'strawgold', 'vtone2': 'darkwood', 'vtone3': 'aegeanblue'}, 'c': {'vtone1': 'greythatch', 'vtone2': 'tarwood', 'vtone3': 'turquoise'}, 'd': {'vtone1': 'mosshatch', 'vtone2': 'pine', 'vtone3': 'honey'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_fale(SPEC, out_dir)
