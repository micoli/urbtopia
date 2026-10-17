import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'arcade-2x2-t1-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (1.96, 1.96), 'floors': 1, 'roof': 'flat', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'door_hood'}, {'type': 'stone_accents', 'density': 9}, {'type': 'roof_vents'}, {'type': 'sign', 'text': 'arcade', 'placement': 'roof'}, {'type': 'bulb_row', 'width': 0.9, 'count': 14}, {'type': 'poster', 'face': 'front', 'along': -0.6, 'art': 'invader', 'width': 0.62, 'z': 0.03, 'height': 0.22}, {'type': 'poster', 'face': 'front', 'along': 0.6, 'art': 'pacman', 'width': 0.62, 'z': 0.03, 'height': 0.22}], 'roof_overhang': 0.01, 'slab_matches_plinth': True, 'roof_deck': 'offwhite', 'floor_bands': False, 'door_along': 0.0, 'auto_windows': [], 'extra_windows': [], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
