import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nature_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("dirt", "#9a7452", 0.0, 1.0), ("dirt_shade", "#7d5c40", 0.0, 1.0),
    ("grass", "#7cbf4a", 0.0, 0.9), ("grass_light", "#95d15c", 0.0, 0.9),
    ("cave", "#3a2a20", 0.0, 1.0),
])

# A cliff fills one 1x1 tile, from 5 cm under the ground up to 0.95, in terraces of 0.2 on a 4x4 grid of cells.
BASE = -0.05
CELL = 0.25
LEVELS = (0.95, 0.75, 0.55, 0.35)


def cell(name, i, j, top):
    ob = lpm.box(name, (CELL, CELL, top - BASE), at=(-0.5 + CELL * (i + 0.5), -0.5 + CELL * (j + 0.5), BASE), color=P["dirt"])
    lpm.paint(ob, P["dirt_shade"], lambda c, n, k: n.x < -0.5 or n.y < -0.5)
    lpm.paint(ob, P["grass"] if (i + j) % 2 else P["grass_light"], lambda c, n, k: n.z > 0.5)
    return ob


def terraces(level_of):
    """level_of(i, j) gives the terrace index of the cell (0 is the top); i runs along +x, j along +y."""
    return lambda rng: [cell(f"c{i}{j}", i, j, LEVELS[level_of(i, j)]) for i in range(4) for j in range(4)]


def block_cave(rng):
    """A full block with a cave dug into its +x face."""
    parts = []
    for name, (x0, x1, y0, y1, z0, z1) in {
        "back": (-0.5, 0.05, -0.5, 0.5, BASE, 0.95),
        "left": (0.05, 0.5, -0.5, -0.18, BASE, 0.95),
        "right": (0.05, 0.5, 0.18, 0.5, BASE, 0.95),
        "lintel": (0.05, 0.5, -0.18, 0.18, 0.5, 0.95),
    }.items():
        ob = lpm.box(name, (x1 - x0, y1 - y0, z1 - z0), at=((x0 + x1) / 2, (y0 + y1) / 2, z0), color=P["dirt"])
        lpm.paint(ob, P["dirt_shade"], lambda c, n, k: n.x < -0.5 or n.y < -0.5)
        lpm.paint(ob, P["grass"], lambda c, n, k: n.z > 0.5 and c.z > 0.9)
        lpm.paint(ob, P["cave"], lambda c, n, k: c.z < 0.9 and abs(c.y) < 0.19 and c.x < 0.49 and (n.z < -0.5 or abs(n.y) > 0.5 or n.x > 0.5))
        parts.append(ob)
    return parts


export_all({
    "cliff_blockCave_rock": block_cave,
    "cliff_steps_rock": terraces(lambda i, j: j),
    "cliff_stepsCorner_rock": terraces(lambda i, j: max(i, j)),
    "cliff_stepsCornerInner_rock": terraces(lambda i, j: min(i, j)),
}, P, budget=300, ground=False, center=False)
