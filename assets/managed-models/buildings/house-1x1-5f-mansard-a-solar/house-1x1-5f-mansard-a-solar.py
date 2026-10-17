import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x1-5f-mansard-a-solar', 'kind': 'house', 'style': 'urbtopia', 'footprint': (1, 1), 'floors': 5, 'roof': 'gable_cross', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'door_hood'}, {'type': 'bushes'}, {'type': 'balcony', 'face': 'front', 'levels': [4], 'at': [0.2]}, {'type': 'balcony', 'face': 'front', 'levels': [3], 'at': [-0.19]}, {'type': 'balcony', 'face': 'front', 'levels': [2], 'at': [0.2]}, {'type': 'balcony', 'face': 'back', 'levels': [2, 4]}, {'type': 'balcony', 'face': 'left', 'levels': [1, 3]}, {'type': 'balcony', 'face': 'right', 'levels': [2, 4]}, {'type': 'solar_panels'}], 'hip_ratio': 0.2, 'bay_width': 0.46, 'bay_depth': 0.24, 'bay_offset': 0.2, 'bay_floors': 1, 'bay_clear_above': True, 'extra_windows': [{'face': 'front', 'along': -0.19}, {'face': 'front', 'along': 0.2, 'level': 2}, {'face': 'front', 'along': 0.2, 'level': 3}, {'face': 'front', 'along': 0.2, 'level': 4}], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
