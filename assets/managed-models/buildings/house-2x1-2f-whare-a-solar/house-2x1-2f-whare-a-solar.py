import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'house-2x1-2f-whare-a-solar', 'style': 'world', 'footprint': (2, 1), 'floors': 2, 'tier': 3, 'tones': {'a': {'vtone1': 'pine', 'vtone2': 'lacquer'}, 'b': {'vtone1': 'darkwood', 'vtone2': 'redclay'}, 'c': {'vtone1': 'tarwood', 'vtone2': 'majorelle'}, 'd': {'vtone1': 'greywood', 'vtone2': 'tilegreen'}}, 'solar': True}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_whare(SPEC, out_dir)
