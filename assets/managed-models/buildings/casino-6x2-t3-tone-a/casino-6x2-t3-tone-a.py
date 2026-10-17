import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'casino-6x2-t3-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (6, 1.8), 'floors': 4, 'roof': 'flat', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'curved_marquee', 'along': -1.6, 'width': 0.6, 'radius': 0.17, 'drop': 0.04}, {'type': 'red_carpet', 'along': -1.6, 'width': 0.36, 'length': 0.2}, {'type': 'door_at', 'along': 1.6}, {'type': 'curved_marquee', 'along': 1.6, 'width': 0.6, 'radius': 0.17, 'drop': 0.04}, {'type': 'red_carpet', 'along': 1.6, 'width': 0.36, 'length': 0.2}, {'type': 'sign', 'text': 'casino', 'placement': 'roof', 'lift': 0.12}, {'type': 'bulb_row', 'width': 5.0, 'count': 60}, {'type': 'roof_die', 'x': -2.4, 'y': 0.45, 'size': 0.3}, {'type': 'roof_card', 'x': 2.4, 'y': -0.4, 'size': 0.38}, {'type': 'roof_coin', 'x': 0.0}, {'type': 'bushes'}], 'roof_overhang': 0.01, 'slab_matches_plinth': True, 'roof_deck': 'offwhite', 'window_pilasters': True, 'roof_stripe': 'vtone2', 'floor_bands': True, 'door_along': -1.6, 'tones': {'a': {'vtone3': 'uwall', 'vtone1': 'sun', 'vtone2': 'brick'}, 'b': {'vtone3': 'uwall', 'vtone1': 'sky', 'vtone2': 'navy'}, 'c': {'vtone3': 'cream', 'vtone1': 'brick', 'vtone2': 'sun'}, 'd': {'vtone3': 'uwall', 'vtone1': 'greygreen', 'vtone2': 'sun'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
