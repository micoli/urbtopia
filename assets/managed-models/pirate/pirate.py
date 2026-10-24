import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "nature"))
import palms  # noqa: E402
import plants  # noqa: E402
from model_lib import export_all, lpm  # noqa: E402

# Bounding boxes of the Kenney models these replace, in Blender axes: the game places them by their raw coordinates.
BOXES = {
    "grass": ((-0.26, -0.27, 0.0), (0.26, 0.27, 0.31)),
    "grass-patch": ((-0.65, -0.63, 0.0), (0.66, 0.64, 0.47)),
    "grass-plant": ((-0.53, -0.58, 0.0), (0.58, 0.66, 0.52)),
    "palm-bend": ((-2.17, -1.61, 0.0), (0.71, 1.61, 4.25)),
    "palm-straight": ((-1.24, -1.24, 0.0), (1.24, 1.24, 4.21)),
    "patch-grass": ((-2.64, -2.06, 0.0), (2.64, 2.06, 0.25)),
    "patch-grass-foliage": ((-2.64, -2.06, 0.0), (2.64, 2.06, 0.56)),
}


def island(rng, foliage):
    """A wide irregular grass patch; the foliage variant carries tufts and bushes."""
    disc = lpm.prism("patch", 11, 1.0, 0.08, color=plants.P["grass"], radius_top=0.94, rotate=rng.uniform(0, 30))
    for v in disc.data.vertices:
        v.co.x *= 1 + rng.uniform(-0.06, 0.06)
        v.co.y *= 1 + rng.uniform(-0.06, 0.06)
    lpm.paint(disc, plants.P["grass_shade"], lambda c, n, i: abs(n.z) < 0.5)
    parts = [disc]
    if foliage:
        for k, (x, y) in enumerate(((-0.5, 0.3), (0.4, -0.35), (0.1, 0.5), (-0.3, -0.45), (0.6, 0.3))):
            for blade in plants.tuft(rng, 6, 0.1, 0.18, prefix=f"t{k}"):
                parts.append(lpm.move(blade, x, y, 0.08))
        for k, (x, y, r) in enumerate(((-0.1, -0.1, 0.16), (0.35, 0.05, 0.12))):
            parts += [lpm.move(b, x, y, 0.08) for b in plants.bush([(0, 0, r, r * 1.3)])(rng)]
    return parts


if __name__ == "__main__":
    finish = {"center": False, "ground": False}
    export_all({
        "grass": lambda rng: plants.tuft(rng, 8, 0.2, 0.31),
        "grass-patch": lambda rng: plants.tuft(rng, 24, 0.6, 0.47),
        "grass-plant": plants.leafs(8, 0.5),
        "patch-grass": lambda rng: island(rng, False),
        "patch-grass-foliage": lambda rng: island(rng, True),
    }, plants.P, 500, HERE, boxes=BOXES, **finish)
    export_all({
        "palm-bend": lambda rng: palms.palm(1.15, -0.4, 7, 0.5, 3, rng),
        "palm-straight": lambda rng: palms.palm(1.25, 0.0, 7, 0.52, 3, rng),
    }, palms.P, 500, HERE, boxes=BOXES, **finish)
