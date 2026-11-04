import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-1x1-4f-valparaiso-a', 'style': 'world', 'footprint': (1, 1), 'floors': 4, 'tones': {'a': {'vtone1': 'turquoise', 'vtone2': 'honey', 'vtone3': 'whitewash'}, 'b': {'vtone1': 'honey', 'vtone2': 'dalablue', 'vtone3': 'whitewash'}, 'c': {'vtone1': 'redclay', 'vtone2': 'pastelpink', 'vtone3': 'whitewash'}, 'd': {'vtone1': 'dalablue', 'vtone2': 'turquoise', 'vtone3': 'whitewash'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_valparaiso(SPEC, out_dir)
