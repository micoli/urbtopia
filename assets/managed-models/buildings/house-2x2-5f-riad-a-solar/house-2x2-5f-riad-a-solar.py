import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-5f-riad-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 5, 'tier': 8, 'solar': True, 'tones': {'a': {'vtone1': 'riadrose', 'vtone2': 'zellige', 'vtone3': 'tilegreen'}, 'b': {'vtone1': 'sandstone', 'vtone2': 'majorelle', 'vtone3': 'tilegreen'}, 'c': {'vtone1': 'redclay', 'vtone2': 'zellige', 'vtone3': 'tilegreen'}, 'd': {'vtone1': 'ochre', 'vtone2': 'majorelle', 'vtone3': 'tilegreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_riad(SPEC, out_dir)
