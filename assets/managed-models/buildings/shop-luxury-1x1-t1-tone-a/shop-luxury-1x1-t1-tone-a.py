import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'shop-luxury-1x1-t1-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (1, 1), 'floors': 1, 'roof': 'flat', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'sun', 'trim': 'utrim', 'door': 'udark', 'accent': 'sun', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'curved_marquee', 'along': -0.32}, {'type': 'red_carpet', 'along': -0.32}, {'type': 'pilasters', 'along': 0.28, 'width': 0.3}, {'type': 'crystals', 'along': 0.28}, {'type': 'bush_at', 'along': -0.16}, {'type': 'sign', 'text': 'jewels', 'placement': 'roof'}], 'roof_overhang': 0.01, 'slab_matches_plinth': True, 'roof_deck': 'offwhite', 'door_along': -0.32, 'auto_windows': [], 'extra_windows': [{'face': 'front', 'along': 0.28, 'width': 0.3, 'z_ratio': 0.1, 'height_ratio': 0.72, 'panes': [1, 1], 'level': 0}, {'face': 'back', 'along': 0.2, 'level': 0}], 'floor_bands': False, 'roof_stripe': 'brick', 'tones': {'a': {'vtone3': 'uwall'}, 'b': {'vtone3': 'uwall'}, 'c': {'vtone3': 'cream'}, 'd': {'vtone3': 'uwall'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
