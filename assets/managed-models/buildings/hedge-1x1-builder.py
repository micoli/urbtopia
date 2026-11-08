import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

BUDGET = 500
HALF_WIDTH = 0.12
HEIGHT = 0.4
BASE_HEIGHT = 0.18

PALETTE = lpm.Palette([
    ("leaf", "#4f9d45", 0.0, 0.85),
    ("leaf_dark", "#3a7c36", 0.0, 0.85),
    ("leaf_light", "#79bb55", 0.0, 0.85),
])

# Blender axes: a tile edge towards the game's south is -Y, like the road pieces.
ARMS = {"W": (-1, 0), "E": (1, 0), "S": (0, -1), "N": (0, 1)}
SHAPES = {
    "hedge-straight": ["W", "E"],
    "hedge-corner": ["W", "S"],
    "hedge-t": ["W", "E", "S"],
    "hedge-cross": ["N", "E", "S", "W"],
}


def lump(name, center, radius, color):
    x, y = center
    profile = [(0, 0), (radius * 0.85, radius * 0.25), (radius, radius * 0.7), (radius * 0.7, radius * 1.1), (0, radius * 1.25)]
    return lpm.lathe(name, profile, segments=6, at=(x, y, HEIGHT + 0.005 - radius * 1.25), color=PALETTE[color])


def block(name, size, at, color):
    return lpm.box(name, (size[0], size[1], BASE_HEIGHT), at=at, color=PALETTE[color])


def cap(name, size, at, color):
    return lpm.box(name, (size[0], size[1], 0.3 - BASE_HEIGHT), at=(at[0], at[1], BASE_HEIGHT), color=PALETTE[color])


def make_parts(arms):
    parts = [
        block("hub", (HALF_WIDTH * 2, HALF_WIDTH * 2), (0, 0, 0), "leaf_dark"),
        cap("hub_cap", (HALF_WIDTH * 2, HALF_WIDTH * 2), (0, 0), "leaf"),
        lump("hub_lump", (0, 0), 0.105, "leaf_light"),
    ]
    for name in arms:
        dx, dy = ARMS[name]
        length = 0.5 - HALF_WIDTH
        middle = HALF_WIDTH + length / 2
        size = (length, HALF_WIDTH * 2) if dx else (HALF_WIDTH * 2, length)
        at = (dx * middle, dy * middle)
        parts.append(block(f"arm_{name}", size, (at[0], at[1], 0), "leaf_dark"))
        parts.append(cap(f"arm_{name}_cap", size, at, "leaf"))
        for k, offset in enumerate((HALF_WIDTH + 0.07, 0.5 - 0.085)):
            parts.append(lump(f"arm_{name}_lump{k}", (dx * offset, dy * offset), 0.085, "leaf_light" if (k + len(name)) % 2 else "leaf_dark"))
    return parts


out_root = os.path.join(os.path.dirname(os.path.abspath(__file__)))
only = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
for model_id, arms in SHAPES.items():
    if only and model_id not in only:
        continue
    lpm.reset()
    hedge = lpm.finish(model_id, make_parts(arms), PALETTE, budget=BUDGET, center=False)
    lpm.export_glb(hedge, os.path.join(out_root, model_id, model_id))
