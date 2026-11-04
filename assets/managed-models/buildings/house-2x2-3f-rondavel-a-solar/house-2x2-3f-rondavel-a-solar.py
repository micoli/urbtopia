import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-rondavel-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 3, 'tier': 6, 'tones': {'a': {'vtone1': 'plaster', 'vtone2': 'thatch', 'vtone3': 'lacquer'}, 'b': {'vtone1': 'siena', 'vtone2': 'strawgold', 'vtone3': 'aegeanblue'}, 'c': {'vtone1': 'redclay', 'vtone2': 'greythatch', 'vtone3': 'honey'}, 'd': {'vtone1': 'dustypink', 'vtone2': 'mosshatch', 'vtone3': 'tilegreen'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_rondavel(SPEC, out_dir)
