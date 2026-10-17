import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'packhouse-2x2-t2-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (1.96, 2.0), 'floors': 1, 'roof': 'gable_half', 'window_sizes': 'same', 'colors': {'wall': 'uwall', 'roof': 'grey', 'trim': 'uframe', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'}, 'wing': None, 'features': [{'type': 'roller_door', 'along': 0.0, 'width': 0.7}, {'type': 'loading_dock', 'along': 0.0, 'width': 0.7}, {'type': 'crate_stacks', 'along': -0.85, 'count': 2}, {'type': 'side_conveyor', 'face': 'right', 'along': 0.1}, {'type': 'sign', 'text': 'packhouse'}, {'type': 'industrial_door', 'face': 'back', 'along': -0.45, 'width': 0.7}, {'type': 'industrial_door', 'face': 'back', 'along': 0.45, 'width': 0.7}, {'type': 'round_window', 'rise': 0.3, 'radius': 0.1, 'stretch': 1.7}, {'type': 'round_window', 'face': 'back', 'rise': 0.3, 'radius': 0.1, 'stretch': 1.7}, {'type': 'bushes'}], 'auto_windows': [], 'roof_overhang': 0.03, 'extra_windows': [{'face': 'front', 'along': 0.62, 'width': 0.22, 'level': 0}, {'face': 'left', 'along': -0.4, 'width': 0.22, 'level': 0}, {'face': 'left', 'along': 0.4, 'width': 0.22, 'level': 0}], 'tones': {'a': {'vtone1': 'mint'}, 'b': {'vtone1': 'tangerine'}, 'c': {'vtone1': 'sky'}, 'd': {'vtone1': 'brick'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
