import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-5f-siheyuan-a-solar', 'solar': True, 'style': 'world', 'footprint': (2, 2), 'floors': 5, 'tones': {'a': {'vtone1': 'greybrick', 'vtone2': 'lacquer', 'vtone3': 'kawara'}, 'b': {'vtone1': 'limestone', 'vtone2': 'lacquer', 'vtone3': 'kawara_blue'}, 'c': {'vtone1': 'sandstone', 'vtone2': 'tilegreen', 'vtone3': 'kawara_brown'}, 'd': {'vtone1': 'yellowbrick', 'vtone2': 'lacquer', 'vtone3': 'kawara'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_siheyuan(SPEC, out_dir)
