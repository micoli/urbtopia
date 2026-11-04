import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x2-2f-dutch-a', 'style': 'world', 'footprint': (1, 2), 'floors': 2, 'tones': {'a': {'vtone1': 'brick', 'vtone2': 'brick_dark', 'vtone3': 'white'}, 'b': {'vtone1': 'yellowbrick', 'vtone2': 'yellowbrick_dark', 'vtone3': 'white'}, 'c': {'vtone1': 'brownstone', 'vtone2': 'brownstone_dark', 'vtone3': 'cream'}, 'd': {'vtone1': 'limestone', 'vtone2': 'limestone_dark', 'vtone3': 'white'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_dutch(SPEC, out_dir)
