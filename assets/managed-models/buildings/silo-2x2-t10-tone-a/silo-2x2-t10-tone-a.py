import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'silo-2x2-t10-tone-a', 'style': 'urbtopia', 'footprint': (2, 2), 'count': 10, 'tones': {'a': {'vtone1': 'brick', 'vtone2': '#a63a28'}, 'b': {'vtone1': 'tangerine', 'vtone2': '#cf7a10'}, 'c': {'vtone1': 'sky', 'vtone2': '#2f7fd0'}, 'd': {'vtone1': 'uroof', 'vtone2': '#5fb894'}}}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_silo(SPEC, out_dir)
