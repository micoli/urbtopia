import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

TIERS = 5


def spec(tier):
    return {
        'id': f'bakery-2x2-t{tier}-tone-a', 'kind': 'office', 'style': 'urbtopia', 'footprint': (2, 2), 'floors': 1, 'roof': 'shed',
        'window_sizes': 'same',
        'colors': {'wall': 'vtone3', 'roof': 'vtone1', 'trim': 'utrim', 'door': 'udark', 'accent': 'vtone1', 'glass': 'glass_blue'},
        'wing': None,
        'features': [
            {'type': 'awning'},
            {'type': 'sign', 'text': 'bakery'},
            {'type': 'bushes'},
            {'type': 'striped_awning', 'along': 0.4, 'width': 0.9},
            {'type': 'stall', 'along': 0.4, 'width': 0.8, 'produce': 'bread'},
            {'type': 'chimney', 'count': tier},
        ],
        'floor_bands': False,
        'door_along': -0.6, 'auto_windows': [],
        'extra_windows': [
            {'face': 'front', 'along': 0.4, 'width': 0.9, 'z_ratio': 0.12, 'height_ratio': 0.7, 'panes': [1, 1], 'level': 0},
            {'face': 'left', 'along': 0.0, 'level': 0},
            {'face': 'right', 'along': 0.0, 'level': 0},
            {'face': 'back', 'along': -0.4, 'level': 0},
            {'face': 'back', 'along': 0.4, 'level': 0},
        ],
        'tones': {
            'a': {'vtone3': 'cream', 'vtone1': 'tangerine'},
            'b': {'vtone3': 'uwall', 'vtone1': 'sky'},
            'c': {'vtone3': 'cream', 'vtone1': 'brick'},
            'd': {'vtone3': 'uwall', 'vtone1': 'greygreen'},
        },
    }


for tier in range(1, TIERS + 1):
    model_dir = os.path.join(HERE, f'bakery-2x2-t{tier}-tone-a')
    os.makedirs(model_dir, exist_ok=True)
    building_lib.build(spec(tier), model_dir)
