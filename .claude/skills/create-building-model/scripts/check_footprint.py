"""
check_footprint.py - run INSIDE Blender through bl.py:
  python ~/.claude/skills/blender-lpm-skill/scripts/bl.py --script check_footprint.py -- --input <id>.glb --width 2 --depth 2 --floors 2 --kind house
Prints ##JSON## {"pass": bool, ...}. Footprint must match within 2 percent, height at least floors x floor height.
"""
import argparse
import json
import sys

import os

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import building_lib  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True)
parser.add_argument("--width", type=float, required=True)
parser.add_argument("--depth", type=float, required=True)
parser.add_argument("--floors", type=int, required=True)
parser.add_argument("--kind", required=True)
args = parser.parse_args(argv)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args.input)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
size = [max(c[i] for c in corners) - min(c[i] for c in corners) for i in range(3)]
floor_total = args.floors * building_lib.FLOOR_HEIGHT[args.kind]
checks = {
    "width": abs(size[0] - args.width) <= 0.02 * args.width,
    "depth": abs(size[1] - args.depth) <= 0.02 * args.depth,
    "height_at_least_walls": size[2] >= floor_total,
    "grounded": abs(min(c[2] for c in corners)) < 1e-3,
}
print("##JSON##" + json.dumps({"pass": all(checks.values()), "size": [round(v, 3) for v in size], "checks": checks}))
