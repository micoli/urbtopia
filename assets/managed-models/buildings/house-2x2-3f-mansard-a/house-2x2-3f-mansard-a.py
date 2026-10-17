import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-mansard-a', 'kind': 'house', 'style': 'urbtopia', 'footprint': (2, 2), 'floors': 3, 'roof': 'gable_cross', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': {'side': 'right', 'width': 0.7, 'depth_ratio': 0.75, 'floors': 1, 'roof': 'flat', 'garage': True, 'overlap': 0.08, 'roof_plants': 3}, 'features': [{'type': 'door_hood'}, {'type': 'bushes'}, {'type': 'balcony', 'face': 'front', 'levels': [2], 'pick': 'last', 'under_window': True}, {'type': 'balcony', 'face': 'back', 'levels': [1], 'pick': 'outer', 'under_window': True}, {'type': 'balcony', 'face': 'back', 'levels': [2], 'pick': 'center', 'under_window': True}, {'type': 'balcony', 'face': 'left', 'levels': [1], 'pick': 'first', 'under_window': True}, {'type': 'balcony', 'face': 'left', 'levels': [2], 'pick': 'last', 'under_window': True}, {'type': 'balcony', 'face': 'right', 'levels': [2], 'pick': 'last', 'under_window': True}], 'hip_ratio': 0.2, 'bay_width': 0.5, 'bay_depth': 0.24, 'bay_offset': -0.3, 'bay_floors': 1, 'bay_clear_above': True, 'bay_natural_roof': True, 'extra_windows': [{'face': 'front', 'along': -0.3, 'level': 2}], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
