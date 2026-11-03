import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x1-1f-stuga-a-solar', 'style': 'world', 'footprint': (1, 1), 'floors': 1, 'tier': 1, 'solar': True, 'tones': {'a': {'vtone1': 'falured', 'vtone2': 'white', 'vtone3': 'slate_dark'}, 'b': {'vtone1': 'ochre', 'vtone2': 'white', 'vtone3': 'slate_dark'}, 'c': {'vtone1': 'dalablue', 'vtone2': 'white', 'vtone3': 'slate_dark'}, 'd': {'vtone1': 'greygreen', 'vtone2': 'cream', 'vtone3': 'slate_dark'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_stuga(SPEC, out_dir)
