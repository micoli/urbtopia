import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-4f-tulou-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 4, 'tones': {'a': {'vtone1': 'ochre', 'vtone2': 'kawara', 'vtone3': 'darkwood'}, 'b': {'vtone1': 'redclay', 'vtone2': 'kawara_brown', 'vtone3': 'tarwood'}, 'c': {'vtone1': 'sandstone', 'vtone2': 'kawara_blue', 'vtone3': 'pine'}, 'd': {'vtone1': 'siena', 'vtone2': 'kawara', 'vtone3': 'darkwood'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_tulou(SPEC, out_dir)
