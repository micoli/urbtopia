import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, thick_corner, thick_wall, thick_window_wall  # noqa: E402

P = lpm.Palette([
    ("wall", "#e9e2d2", 0.0, 0.9), ("wall_cap", "#d6cdb8", 0.0, 0.9), ("plinth", "#5d8f6a", 0.0, 0.8), ("band", "#e0533d", 0.0, 0.8),
    ("floor", "#e6e8ee", 0.0, 0.8), ("floor_dark", "#c4c9d4", 0.0, 0.8),
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("glass", "#cfeefa", 0.0, 0.2),
    ("wood", "#c48a54", 0.0, 0.8), ("wood_dark", "#9a6538", 0.0, 0.8), ("panel", "#2a2d3a", 0.0, 0.7), ("screen", "#7fe0ff", 0.0, 0.3, 1.0),
    ("green", "#5aae4a", 0.0, 0.7), ("red", "#e04848", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7), ("orange", "#f28a2c", 0.0, 0.7),
    ("blue", "#4a8fe0", 0.0, 0.7), ("bread", "#d9a35a", 0.0, 0.8), ("bread_dark", "#b07a38", 0.0, 0.8),
    ("card", "#c9a575", 0.0, 0.9), ("bag", "#f2ece0", 0.0, 0.9), ("ice", "#e8f6fb", 0.0, 0.5),
])

# Bounding boxes of the Kenney models these replace, in Blender axes (front on -y).
BOXES = {
    "bottle-return": ((-0.22, -0.21, 0.0), (0.22, 0.27, 1.09)),
    "cash-register": ((-0.4, -0.45, 0.0), (0.45, 0.4, 0.59)),
    "display-bread": ((-0.35, -0.3, 0.0), (0.35, 0.3, 0.5)),
    "display-fruit": ((-0.3, -0.3, 0.0), (0.3, 0.3, 0.52)),
    "freezer": ((-0.4, -0.3, 0.0), (0.4, 0.3, 0.35)),
    "freezers-standing": ((-0.5, 0.0, 0.0), (0.5, 0.5, 0.9)),
    "shelf-bags": ((-0.4, -0.35, 0.0), (0.4, 0.35, 0.89)),
    "shelf-boxes": ((-0.4, -0.35, 0.0), (0.4, 0.35, 0.85)),
    "shopping-basket": ((-0.17, -0.18, 0.0), (0.17, 0.18, 0.25)),
    "shopping-cart": ((-0.15, -0.23, 0.0), (0.15, 0.25, 0.39)),
}


def bottle_return(rng):
    return [block("body", -0.2, 0.2, -0.17, 0.25, 0, 1.0, P["green"]), block("top", -0.22, 0.22, -0.19, 0.27, 1.0, 1.09, P["steel"]),
            block("face", -0.15, 0.15, -0.19, -0.17, 0.2, 0.9, P["steel"]), block("screen", -0.08, 0.08, -0.2, -0.19, 0.65, 0.8, P["screen"]),
            block("hole", -0.06, 0.06, -0.21, -0.19, 0.42, 0.54, P["panel"]),
            block("receipt", -0.04, 0.04, -0.21, -0.19, 0.3, 0.33, P["bag"])]


def checkout(rng):
    """An L counter: the belt runs along -y, the cashier stands inside the L."""
    parts = [block("belt_base", -0.4, 0.45, -0.45, -0.1, 0, 0.5, P["wood"]), block("belt", -0.38, 0.3, -0.42, -0.13, 0.5, 0.52, P["panel"]),
             block("side", 0.1, 0.45, -0.1, 0.4, 0, 0.5, P["wood"]), block("top", 0.1, 0.45, -0.1, 0.4, 0.5, 0.52, P["wood_dark"]),
             block("register", 0.18, 0.4, 0.05, 0.3, 0.52, 0.57, P["steel"]), block("display", 0.2, 0.38, 0.27, 0.3, 0.57, 0.59, P["screen"])]
    for k in range(3):
        parts.append(block(f"item{k}", -0.3 + 0.18 * k, -0.22 + 0.18 * k, -0.33, -0.23, 0.52, 0.58, P[("red", "yellow", "blue")[k]]))
    return parts


def display_bread(rng):
    parts = [block("base", -0.35, 0.35, -0.3, 0.3, 0, 0.2, P["wood_dark"])]
    for k, (y, z) in enumerate(((-0.15, 0.2), (0.12, 0.33))):
        parts.append(block(f"tier{k}", -0.33, 0.33, y - 0.14, y + 0.14, 0, z, P["wood"]))
        for m in range(3):
            loaf = lpm.lathe(f"loaf{k}{m}", [(0.05, 0), (0.06, 0.04), (0.03, 0.08), (0, 0.09)], segments=6, at=(-0.2 + 0.2 * m, y, z), color=P["bread"])
            lpm.scale(loaf, 1.6, 1, 1, about=(-0.2 + 0.2 * m, y, z))
            lpm.paint(loaf, P["bread_dark"], lambda c, n, i: n.z > 0.6)
            parts.append(loaf)
    return parts


def display_fruit(rng):
    parts = [block("stand", -0.3, 0.3, -0.3, 0.3, 0, 0.35, P["wood_dark"])]
    for k, (x, y, color) in enumerate(((-0.14, -0.14, "red"), (0.14, -0.14, "orange"), (-0.14, 0.14, "green"), (0.14, 0.14, "yellow"))):
        parts.append(block(f"crate{k}", x - 0.13, x + 0.13, y - 0.13, y + 0.13, 0.35, 0.42, P["wood"]))
        for m in range(4):
            parts.append(lpm.lathe(f"fruit{k}{m}", [(0, -0.04), (0.045, 0), (0, 0.04)], segments=6,
                                   at=(x + (m % 2 - 0.5) * 0.1, y + (m // 2 - 0.5) * 0.1, 0.46), color=P[color]))
    return parts


def freezer(rng):
    return [block("body", -0.4, 0.4, -0.3, 0.3, 0, 0.3, P["steel"]), block("rim", -0.4, 0.4, -0.3, 0.3, 0.3, 0.32, P["steel_dark"]),
            block("lid", -0.37, 0.37, -0.27, 0.27, 0.32, 0.35, P["glass"]), block("ice", -0.35, 0.35, -0.25, 0.25, 0.28, 0.3, P["ice"]),
            block("kick", -0.4, 0.4, -0.31, -0.3, 0.0, 0.06, P["panel"])]


def freezers_standing(rng):
    """Two tall glass-door fridges against the wall, opening toward -y."""
    parts = [block("body", -0.5, 0.5, 0.0, 0.5, 0, 0.9, P["steel"])]
    for k, x in enumerate((-0.25, 0.25)):
        parts.append(block(f"door{k}", x - 0.23, x + 0.23, -0.0, 0.02, 0.06, 0.84, P["glass"]))
        parts.append(block(f"handle{k}", x + (0.18 if k == 0 else -0.2), x + (0.2 if k == 0 else -0.18), -0.03, 0.0, 0.35, 0.6, P["steel_dark"]))
        for m in range(3):
            parts.append(block(f"goods{k}{m}", x - 0.18, x + 0.18, 0.08, 0.2, 0.15 + 0.25 * m, 0.25 + 0.25 * m, P[("blue", "red", "yellow")[(k + m) % 3]]))
    return parts


def shelf(goods):
    """A two-sided gondola with three shelves of goods on each side."""
    def build(rng):
        parts = [block("spine", -0.4, 0.4, -0.03, 0.03, 0, 0.89 if goods == "bags" else 0.85, P["steel_dark"]),
                 block("base", -0.4, 0.4, -0.35, 0.35, 0, 0.06, P["steel"])]
        for level, z in enumerate((0.06, 0.32, 0.58)):
            parts.append(block(f"shelf{level}", -0.4, 0.4, -0.35, 0.35, z, z + 0.02, P["steel"]))
            for side in (-1, 1):
                for m in range(4):
                    x = -0.3 + 0.2 * m
                    y0, y1 = (-0.3, -0.06) if side < 0 else (0.06, 0.3)
                    if goods == "bags":
                        item = block(f"bag{level}{side}{m}", x - 0.07, x + 0.07, y0, y1, z + 0.02, z + 0.2, P["bag"])
                        lpm.paint(item, P[rng.choice(("red", "green", "blue", "orange"))], lambda c, n, i: abs(n.y) > 0.5)
                    else:
                        item = block(f"box{level}{side}{m}", x - 0.08, x + 0.08, y0, y1, z + 0.02, z + 0.16, P["card"])
                        lpm.paint(item, P[rng.choice(("red", "yellow", "blue"))], lambda c, n, i: abs(n.y) > 0.5 and c.z > z + 0.08)
                    parts.append(item)
        return parts
    return build


def basket(rng):
    parts = [block("bottom", -0.15, 0.15, -0.16, 0.16, 0, 0.02, P["red"])]
    for k, (x0, x1, y0, y1) in enumerate(((-0.17, 0.17, -0.18, -0.16), (-0.17, 0.17, 0.16, 0.18), (-0.17, -0.15, -0.16, 0.16), (0.15, 0.17, -0.16, 0.16))):
        parts.append(block(f"side{k}", x0, x1, y0, y1, 0, 0.16, P["red"]))
    for k, x in enumerate((-0.12, 0.12)):
        parts.append(block(f"handle{k}", x - 0.01, x + 0.01, -0.01, 0.01, 0.16, 0.25, P["panel"]))
    parts.append(block("grip", -0.12, 0.12, -0.01, 0.01, 0.24, 0.25, P["panel"]))
    return parts


def cart(rng):
    parts = [block("basket", -0.14, 0.14, -0.15, 0.2, 0.15, 0.36, P["steel"]), block("inside", -0.12, 0.12, -0.13, 0.18, 0.17, 0.37, P["steel_dark"]),
             block("handle", -0.15, 0.15, 0.22, 0.25, 0.36, 0.39, P["red"]), block("frame", -0.12, 0.12, -0.2, 0.2, 0.08, 0.1, P["steel_dark"])]
    for k, (x, y) in enumerate(((-0.1, -0.18), (0.1, -0.18), (-0.1, 0.18), (0.1, 0.18))):
        wheel = lpm.prism(f"wheel{k}", 8, 0.035, 0.02, color=P["panel"])
        lpm.rotate(wheel, 90, "Y")
        parts.append(lpm.move(wheel, x - 0.01, y, 0.035))
        parts.append(block(f"post{k}", x - 0.008, x + 0.008, y - 0.008, y + 0.008, 0.04, 0.15, P["steel_dark"]))
    return parts


if __name__ == "__main__":
    export_all({
        "bottle-return": bottle_return, "cash-register": checkout, "display-bread": display_bread, "display-fruit": display_fruit,
        "freezer": freezer, "freezers-standing": freezers_standing, "shelf-bags": shelf("bags"), "shelf-boxes": shelf("boxes"),
        "shopping-basket": basket, "shopping-cart": cart,
        "floor": lambda rng: checker_floor(P, "floor", "floor_dark"),
        "wall": lambda rng: thick_wall(P, "wall", "band", "plinth", "wall_cap"),
        "wall-window": lambda rng: thick_window_wall(P, "wall", "plinth", "glass", "plinth", "wall_cap"),
        "wall-corner": lambda rng: thick_corner(P, "wall", "band", "plinth", "wall_cap"),
    }, P, 900, HERE, boxes=BOXES, center=False, ground=False)
