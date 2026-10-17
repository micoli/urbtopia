import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'workshop-2x2-t3-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (2, 2), 'floors': 1, 'roof': 'sawtooth', 'window_sizes': 'same', 'colors': {'wall': 'uwall', 'roof': 'grey', 'trim': 'uframe', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'roller_door', 'along': -0.3}, {'type': 'smokestack', 'count': 3}, {'type': 'industrial_door', 'face': 'back', 'along': 0.0, 'width': 1.5}, {'type': 'sign', 'text': 'workshop', 'placement': 'roof'}], 'floor_height_scale': 1.5, 'auto_windows': ['front', 'left', 'right'], 'tones': {'a': {'vtone1': 'tangerine'}, 'b': {'vtone1': 'sky'}, 'c': {'vtone1': 'brick'}, 'd': {'vtone1': 'mint'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
