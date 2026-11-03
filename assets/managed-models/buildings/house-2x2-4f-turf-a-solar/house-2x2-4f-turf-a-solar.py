import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-4f-turf-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 4, 'tier': 7, 'solar': True, 'tones': {'a': {'vtone1': 'tarwood', 'vtone2': 'earth', 'vtone3': 'turfgreen'}, 'b': {'vtone1': 'greywood', 'vtone2': 'earth', 'vtone3': 'turfgreen'}, 'c': {'vtone1': 'falured', 'vtone2': 'earth', 'vtone3': 'turfgreen'}, 'd': {'vtone1': 'dalablue', 'vtone2': 'earth', 'vtone3': 'turfgreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_turf(SPEC, out_dir)
