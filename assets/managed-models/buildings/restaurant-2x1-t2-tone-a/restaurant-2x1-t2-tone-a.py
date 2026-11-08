import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'restaurant-2x1-t2-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (1.96, 0.72), 'floors': 1, 'roof': 'hip', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'pergola', 'depth': 0.3, 'width': 1.1, 'tables': 2}, {'type': 'sign', 'text': 'restaurant'}, {'type': 'chimney'}, {'type': 'industrial_door', 'face': 'back', 'along': 0.0, 'width': 0.6}, {'type': 'bushes'}], 'slab_matches_plinth': True, 'floor_bands': False, 'door_along': 0.0, 'auto_windows': [], 'extra_windows': [{'face': 'front', 'along': -0.54, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}, {'face': 'front', 'along': 0.54, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}, {'face': 'left', 'along': 0.0, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}, {'face': 'right', 'along': 0.0, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}], 'tones': {'a': {'vtone3': 'cream', 'vtone1': 'brick'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
