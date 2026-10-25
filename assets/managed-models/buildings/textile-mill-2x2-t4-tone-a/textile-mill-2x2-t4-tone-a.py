import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'textile-mill-2x2-t4-tone-a', 'style': 'urbtopia', 'footprint': (2, 2), 'count': 4, 'tones': {'a': {'vtone1': 'brick', 'vtone2': '#8a3322', 'vtone3': 'uwall'}, 'b': {'vtone1': 'tangerine', 'vtone2': '#a85e0e', 'vtone3': 'uwall'}, 'c': {'vtone1': 'sky', 'vtone2': '#2a6fb8', 'vtone3': 'uwall'}, 'd': {'vtone1': 'uroof', 'vtone2': '#4a9a78', 'vtone3': 'uwall'}}}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_textile_mill(SPEC, out_dir)
