import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402

P = lpm.Palette([
    ("slat", "#c27a44", 0.0, 0.85), ("slat_dark", "#9a5a30", 0.0, 0.85),
    ("iron", "#3c4150", 0.4, 0.5), ("iron_light", "#5a6072", 0.4, 0.5),
    ("glass", "#ffd77a", 0.0, 0.3, 2.0),
])

# Bounding boxes of the Kenney models these replace, in Blender axes: the game places them by their raw coordinates.
BOXES = {
    "bench": ((-0.56, -0.32, 0.0), (0.56, 0.32, 0.73)),
    "lantern": ((-0.26, -0.23, 0.0), (0.26, 0.23, 1.74)),
}


def bench(rng):
    """A park bench facing -y: wooden slats on two cast iron side frames, the backrest on +y."""
    parts = []
    for k, x in enumerate((-0.48, 0.48)):
        parts.append(lpm.box(f"leg{k}f", (0.05, 0.05, 0.33), at=(x, -0.22, 0), color=P["iron"]))
        parts.append(lpm.box(f"leg{k}b", (0.05, 0.05, 0.73), at=(x, 0.24, 0), color=P["iron"]))
        parts.append(lpm.box(f"arm{k}", (0.05, 0.5, 0.04), at=(x, 0.0, 0.33), color=P["iron_light"]))
    for k in range(3):
        parts.append(lpm.box(f"seat{k}", (1.1, 0.13, 0.04), at=(0, -0.2 + 0.15 * k, 0.33), color=P["slat" if k % 2 else "slat_dark"]))
    for k in range(2):
        back = lpm.box(f"back{k}", (1.1, 0.04, 0.11), at=(0, 0.27, 0.45 + 0.15 * k), color=P["slat"])
        parts.append(back)
    return parts


def lantern(rng):
    """A cast iron street lamp: a stepped base, a slim post and a glowing four-sided head under a cap."""
    parts = [
        lpm.prism("base", 8, 0.16, 0.12, color=P["iron"], radius_top=0.12),
        lpm.prism("post", 8, 0.045, 1.3, at=(0, 0, 0.12), color=P["iron_light"], radius_top=0.035),
        lpm.prism("collar", 8, 0.07, 0.05, at=(0, 0, 1.4), color=P["iron"]),
        lpm.box("glass", (0.18, 0.18, 0.2), at=(0, 0, 1.45), color=P["glass"], taper=(1.25, 1.25)),
        lpm.prism("cap", 4, 0.2, 0.12, at=(0, 0, 1.65), color=P["iron"], radius_top=0.02, rotate=45),
    ]
    for k, (x, y) in enumerate(((0.1, 0.1), (-0.1, 0.1), (0.1, -0.1), (-0.1, -0.1))):
        parts.append(lpm.box(f"bar{k}", (0.02, 0.02, 0.2), at=(x * 1.1, y * 1.1, 1.45), color=P["iron"]))
    return parts


if __name__ == "__main__":
    export_all({"bench": bench, "lantern": lantern}, P, 400, HERE, boxes=BOXES, center=False, ground=False)
