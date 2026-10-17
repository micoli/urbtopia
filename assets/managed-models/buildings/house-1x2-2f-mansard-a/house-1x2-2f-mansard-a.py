import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x2-2f-mansard-a', 'kind': 'house', 'style': 'urbtopia', 'footprint': (1, 2), 'floors': 2, 'roof': 'gable_cross', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'door_hood'}, {'type': 'bushes'}, {'type': 'balcony', 'face': 'left', 'levels': [1], 'pick': 'first', 'under_window': True}, {'type': 'balcony', 'face': 'right', 'levels': [1], 'pick': 'last', 'under_window': True}], 'hip_ratio': 0.2, 'bay_width': 0.42, 'bay_depth': 0.22, 'bay_offset': 0.15, 'bay_floors': 1, 'bay_clear_above': True, 'bay_natural_roof': True, 'extra_windows': [{'face': 'front', 'along': -0.19}], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
