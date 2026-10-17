import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x1-2f-tone-a', 'kind': 'house', 'style': 'urbtopia', 'footprint': (2, 1), 'floors': 2, 'roof': 'gable_cross', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': {'side': 'right', 'width': 0.67, 'depth_ratio': 1.0, 'floors': 1, 'roof': 'flat', 'garage': True, 'overlap': 0.08, 'roof_plants': 3}, 'features': [{'type': 'door_hood'}, {'type': 'bushes'}], 'bay_width': 0.46, 'bay_depth': 0.24, 'bay_offset': -0.2, 'bay_floors': 1, 'bay_clear_above': True, 'extra_windows': [{'face': 'front', 'along': -0.475, 'level': 1, 'width_factor': 0.5}], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
