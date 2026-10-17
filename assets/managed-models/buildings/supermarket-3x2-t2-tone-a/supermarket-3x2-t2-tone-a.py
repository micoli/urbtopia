import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'supermarket-3x2-t2-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (2.96, 1.96), 'floors': 1, 'roof': 'flat', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'awning'}, {'type': 'striped_awning', 'along': 0.0, 'width': 0.9, 'rise': 0.8, 'reach': 0.14}, {'type': 'sign', 'text': 'supermarket', 'placement': 'roof'}, {'type': 'stall', 'along': -1.05, 'width': 0.44}, {'type': 'stall', 'along': -0.55, 'width': 0.44}, {'type': 'stall', 'along': 0.55, 'width': 0.44}, {'type': 'stall', 'along': 1.05, 'width': 0.44}, {'type': 'industrial_door', 'face': 'back', 'along': 0.0, 'width': 0.7}, {'type': 'bushes'}], 'roof_overhang': 0.01, 'slab_matches_plinth': True, 'roof_deck': 'offwhite', 'floor_bands': False, 'door_along': 0.0, 'auto_windows': [], 'extra_windows': [{'face': 'front', 'along': -1.05, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}, {'face': 'front', 'along': -0.55, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}, {'face': 'front', 'along': 0.55, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}, {'face': 'front', 'along': 1.05, 'width': 0.4, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0}], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
