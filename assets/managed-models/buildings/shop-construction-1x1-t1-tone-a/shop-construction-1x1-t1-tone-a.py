import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'shop-construction-1x1-t1-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (0.98, 1.0), 'floors': 1, 'roof': 'gable_half', 'window_sizes': 'same', 'colors': {'wall': 'vtone3', 'roof': 'grey', 'trim': 'utrim', 'door': 'udark', 'accent': 'slate', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'marquee', 'along': -0.32}, {'type': 'wall_tools', 'along': -0.02, 'width': 0.2}, {'type': 'material_yard', 'along': 0.3, 'width': 0.4}, {'type': 'bush_at', 'along': -0.16}, {'type': 'sign', 'text': 'build'}, {'type': 'industrial_door', 'face': 'back', 'along': 0.0, 'width': 0.62}], 'roof_overhang': 0.03, 'slab_matches_plinth': True, 'roof_deck': 'offwhite', 'door_along': -0.32, 'auto_windows': [], 'extra_windows': [{'face': 'front', 'along': 0.3, 'width': 0.2, 'level': 0}, {'face': 'left', 'along': -0.26, 'width': 0.2, 'level': 0}, {'face': 'left', 'along': 0.26, 'width': 0.2, 'level': 0}, {'face': 'right', 'along': -0.26, 'width': 0.2, 'level': 0}, {'face': 'right', 'along': 0.26, 'width': 0.2, 'level': 0}], 'tones': {'a': {'vtone3': 'uwall'}, 'b': {'vtone3': 'uwall'}, 'c': {'vtone3': 'cream'}, 'd': {'vtone3': 'uwall'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
