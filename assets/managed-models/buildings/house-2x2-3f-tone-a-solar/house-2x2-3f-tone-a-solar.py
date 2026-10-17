import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-tone-a-solar', 'kind': 'apartment', 'style': 'urbtopia', 'footprint': (2, 2), 'floors': 3, 'roof': 'mansard', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'awning'}, {'type': 'bushes'}, {'type': 'balcony', 'face': 'front', 'levels': [2], 'pick': 'outer'}, {'type': 'balcony', 'face': 'front', 'levels': [1], 'pick': 'center'}, {'type': 'balcony', 'face': 'back', 'levels': [2], 'pick': 'outer'}, {'type': 'balcony', 'face': 'back', 'levels': [1], 'pick': 'center'}, {'type': 'balcony', 'face': 'left', 'levels': [2], 'pick': 'outer'}, {'type': 'balcony', 'face': 'left', 'levels': [1], 'pick': 'center'}, {'type': 'balcony', 'face': 'right', 'levels': [2], 'pick': 'outer'}, {'type': 'balcony', 'face': 'right', 'levels': [1], 'pick': 'center'}, {'type': 'solar_panels'}], 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'uroof'}, 'b': {'vtone3': 'uwall', 'vtone1': 'bluegrey'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
