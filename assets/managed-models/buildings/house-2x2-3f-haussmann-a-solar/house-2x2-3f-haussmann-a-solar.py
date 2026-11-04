import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-haussmann-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 3, 'solar': True, 'tones': {'a': {'vtone1': 'cream', 'vtone2': 'limestone_dark', 'vtone3': 'white'}, 'b': {'vtone1': 'limestone', 'vtone2': 'limestone_dark', 'vtone3': 'cream'}, 'c': {'vtone1': 'yellowbrick', 'vtone2': 'yellowbrick_dark', 'vtone3': 'cream'}, 'd': {'vtone1': 'brownstone', 'vtone2': 'brownstone_dark', 'vtone3': 'cream'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_haussmann(SPEC, out_dir)
