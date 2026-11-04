import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-3f-aegean-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 3, 'tier': 6, 'solar': True, 'tones': {'a': {'vtone1': 'whitewash', 'vtone2': 'aegeanblue', 'vtone3': 'aegeanblue'}, 'b': {'vtone1': 'paleblue', 'vtone2': 'turquoise', 'vtone3': 'turquoise'}, 'c': {'vtone1': 'cream', 'vtone2': 'aegeanblue', 'vtone3': 'aegeanblue'}, 'd': {'vtone1': 'pastelpink', 'vtone2': 'turquoise', 'vtone3': 'whitewash'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_aegean(SPEC, out_dir)
