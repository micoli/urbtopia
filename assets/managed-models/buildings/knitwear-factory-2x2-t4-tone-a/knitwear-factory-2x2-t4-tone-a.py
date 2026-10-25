import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'knitwear-factory-2x2-t4-tone-a', 'style': 'urbtopia', 'footprint': (2, 2), 'count': 4, 'tones': {'a': {'vtone1': 'pink', 'vtone2': '#c94a82', 'vtone3': 'uwall'}, 'b': {'vtone1': 'sky', 'vtone2': '#2f7fd0', 'vtone3': 'uwall'}, 'c': {'vtone1': 'violet', 'vtone2': '#6f48c8', 'vtone3': 'uwall'}, 'd': {'vtone1': 'sun', 'vtone2': '#c79a00', 'vtone3': 'uwall'}}}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_knitwear(SPEC, out_dir)
