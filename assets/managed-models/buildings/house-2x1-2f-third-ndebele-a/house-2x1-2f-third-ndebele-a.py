import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x1-2f-third-ndebele-a', 'style': 'world', 'footprint': (2, 1), 'floors': 2, 'tier': 4, 'tones': {'a': {'vtone1': 'dalablue', 'vtone2': 'redclay', 'vtone3': 'honey'}, 'b': {'vtone1': 'turquoise', 'vtone2': 'lacquer', 'vtone3': 'aegeanblue'}, 'c': {'vtone1': 'redclay', 'vtone2': 'tilegreen', 'vtone3': 'honey'}, 'd': {'vtone1': 'honey', 'vtone2': 'majorelle', 'vtone3': 'tilegreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_ndebele(SPEC, out_dir)
