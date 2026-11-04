import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x2-5f-tudor-a-solar', 'style': 'world', 'footprint': (2, 2), 'floors': 5, 'tier': 8, 'solar': True, 'tones': {'a': {'vtone1': 'plaster', 'vtone2': 'timber', 'vtone3': 'tile'}, 'b': {'vtone1': 'whitewash', 'vtone2': 'blackwood', 'vtone3': 'slate_dark'}, 'c': {'vtone1': 'ochre', 'vtone2': 'timber', 'vtone3': 'thatch'}, 'd': {'vtone1': 'cream', 'vtone2': 'timber', 'vtone3': 'brick'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_tudor(SPEC, out_dir)
