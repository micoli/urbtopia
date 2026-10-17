import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'tower-1x1-4f-tone-a-solar', 'kind': 'apartment', 'style': 'urbtopia', 'footprint': (1, 1), 'floors': 4, 'roof': 'flat', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'awning'}, {'type': 'bushes'}, {'type': 'stair_head'}, {'type': 'balcony', 'face': 'front', 'levels': [1, 3]}, {'type': 'balcony', 'face': 'back', 'levels': [1, 3]}, {'type': 'balcony', 'face': 'left', 'levels': [2]}, {'type': 'balcony', 'face': 'right', 'levels': [2]}, {'type': 'solar_panels'}], 'roof_overhang': 0.01, 'slab_matches_plinth': True, 'floor_bands': True, 'roof_deck': 'offwhite', 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
