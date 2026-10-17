import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'casino-2x2-t1-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (2, 1.8), 'floors': 3, 'roof': 'flat', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'curved_marquee', 'along': 0.0, 'width': 0.56, 'radius': 0.16, 'drop': 0.04}, {'type': 'red_carpet', 'along': 0.0, 'width': 0.34, 'length': 0.2}, {'type': 'sign', 'text': 'casino', 'placement': 'roof', 'lift': 0.1}, {'type': 'bulb_row', 'width': 1.4, 'count': 20}, {'type': 'roof_die', 'x': 0.6, 'y': 0.45}, {'type': 'bushes'}], 'roof_overhang': 0.01, 'slab_matches_plinth': True, 'roof_deck': 'offwhite', 'window_pilasters': True, 'roof_stripe': 'vtone2', 'floor_bands': True, 'door_along': 0.0, 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'sun', 'vtone2': 'brick'}, 'b': {'vtone3': 'uwall', 'vtone1': 'sky', 'vtone2': 'navy'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick', 'vtone2': 'sun'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen', 'vtone2': 'sun'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
