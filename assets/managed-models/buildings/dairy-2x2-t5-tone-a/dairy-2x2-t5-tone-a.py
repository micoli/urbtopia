import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'dairy-2x2-t5-tone-a', 'style': 'urbtopia', 'footprint': (2, 2), 'count': 5, 'tones': {'a': {'vtone1': 'sun', 'vtone2': '#c79a00', 'vtone3': 'uwall'}, 'b': {'vtone1': 'sky', 'vtone2': '#2f7fd0', 'vtone3': 'uwall'}, 'c': {'vtone1': 'uroof', 'vtone2': '#5fb894', 'vtone3': 'uwall'}, 'd': {'vtone1': 'tangerine', 'vtone2': '#cf7a10', 'vtone3': 'uwall'}}}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_dairy(SPEC, out_dir)
