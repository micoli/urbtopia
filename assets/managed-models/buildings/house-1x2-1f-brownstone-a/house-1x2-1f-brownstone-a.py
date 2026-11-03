import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x2-1f-brownstone-a', 'style': 'world', 'footprint': (1, 2), 'floors': 1, 'tones': {'a': {'vtone1': 'brownstone', 'vtone2': 'brownstone_dark', 'vtone3': 'cream'}, 'b': {'vtone1': 'brick', 'vtone2': 'brick_dark', 'vtone3': 'cream'}, 'c': {'vtone1': 'limestone', 'vtone2': 'limestone_dark', 'vtone3': 'white'}, 'd': {'vtone1': 'yellowbrick', 'vtone2': 'yellowbrick_dark', 'vtone3': 'cream'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_brownstone(SPEC, out_dir)
