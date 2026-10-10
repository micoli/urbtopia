import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, ".claude/skills/create-building-model/scripts"))
import building_lib  # noqa: E402

SPEC = {
    "id": "__ID__",
    "kind": "__KIND__",
    "style": "__STYLE__",
    "footprint": (__WIDTH__, __DEPTH__),
    "floors": __FLOORS__,
    "roof": "__ROOF__",
    "window_sizes": "__WINDOW_SIZES__",
    "colors": {__COLORS__},
    "wing": __WING__,
    "features": [],
}

out_dir = os.path.dirname(os.path.abspath(__file__))
building_lib.build(SPEC, out_dir)
