import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-2f-rondavel-a', 'style': 'world', 'footprint': (2, 2), 'floors': 2, 'tier': 5, 'tones': {'a': {'vtone1': 'plaster', 'vtone2': 'thatch', 'vtone3': 'lacquer'}, 'b': {'vtone1': 'siena', 'vtone2': 'strawgold', 'vtone3': 'aegeanblue'}, 'c': {'vtone1': 'redclay', 'vtone2': 'greythatch', 'vtone3': 'honey'}, 'd': {'vtone1': 'dustypink', 'vtone2': 'mosshatch', 'vtone3': 'tilegreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_rondavel(SPEC, out_dir)
