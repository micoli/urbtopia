import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-stilt-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 3, 'tier': 6, 'tones': {'a': {'vtone1': 'thatch', 'vtone2': 'pine', 'vtone3': 'darkwood'}, 'b': {'vtone1': 'redclay', 'vtone2': 'greywood', 'vtone3': 'tarwood'}, 'c': {'vtone1': 'greythatch', 'vtone2': 'darkwood', 'vtone3': 'pine'}, 'd': {'vtone1': 'mosshatch', 'vtone2': 'honey', 'vtone3': 'tarwood'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_stilt(SPEC, out_dir)
