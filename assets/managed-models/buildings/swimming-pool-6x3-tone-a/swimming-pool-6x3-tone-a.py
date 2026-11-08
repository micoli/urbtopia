import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {'id': 'swimming-pool-6x3-tone-a', 'style': 'urbtopia', 'footprint': (6, 3), 'tones': {'a': {'vtone1': 'coral'}, 'b': {'vtone1': 'cobalt'}, 'c': {'vtone1': 'sun'}, 'd': {'vtone1': 'mint'}}}
out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build_swimming_pool(SPEC, out_dir)
