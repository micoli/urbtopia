import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x2-4f-machiya-a-solar', 'solar': True, 'style': 'world', 'footprint': (1, 2), 'floors': 4, 'tones': {'a': {'vtone1': 'tarwood', 'vtone2': 'clayplaster', 'vtone3': 'kawara'}, 'b': {'vtone1': 'greywood', 'vtone2': 'ochre', 'vtone3': 'kawara_blue'}, 'c': {'vtone1': 'darkwood', 'vtone2': 'sandwall', 'vtone3': 'kawara_brown'}, 'd': {'vtone1': 'blackwood', 'vtone2': 'siena', 'vtone3': 'kawara'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_machiya(SPEC, out_dir)
