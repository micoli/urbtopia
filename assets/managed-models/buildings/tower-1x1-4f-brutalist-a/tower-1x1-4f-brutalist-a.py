import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'tower-1x1-4f-brutalist-a', 'style': 'world', 'footprint': (1, 1), 'floors': 4, 'tones': {'a': {'vtone1': 'concrete', 'vtone2': 'lacquer'}, 'b': {'vtone1': 'concrete_warm', 'vtone2': 'aegeanblue'}, 'c': {'vtone1': 'concrete_dark', 'vtone2': 'ochre'}, 'd': {'vtone1': 'concrete_pink', 'vtone2': 'tilegreen'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_brutalist(SPEC, out_dir)
