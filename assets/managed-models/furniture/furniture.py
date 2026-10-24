import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc  # noqa: E402

P = lpm.Palette([
    ("wall", "#f1ebe0", 0.0, 0.9), ("trim", "#c9b79c", 0.0, 0.9), ("floor", "#d8b98e", 0.0, 0.8), ("floor_dark", "#c4a276", 0.0, 0.8),
    ("wood", "#b98656", 0.0, 0.8), ("wood_dark", "#8a5d36", 0.0, 0.8), ("fabric", "#e58a7a", 0.0, 0.95), ("fabric_dark", "#c96b5c", 0.0, 0.95),
    ("sheet", "#f6f2ea", 0.0, 0.95), ("blue", "#6a8fc8", 0.0, 0.9), ("porcelain", "#f4f6f8", 0.0, 0.3), ("chrome", "#b8c0cc", 0.6, 0.3),
    ("glass", "#cfeefa", 0.0, 0.2), ("black", "#2a2d3a", 0.0, 0.5), ("screen", "#3a4a6a", 0.0, 0.2), ("lamp", "#ffe2a0", 0.0, 0.5, 1.5),
    ("leaf", "#5aa646", 0.0, 0.8), ("pot", "#cf6a40", 0.0, 0.8), ("rug", "#7a9bd0", 0.0, 1.0), ("rug_border", "#e3c46a", 0.0, 1.0),
    ("metal", "#9aa1ab", 0.5, 0.4),
])

# Bounding boxes of the Kenney models these replace, in Blender axes (front on -y).
BOXES = {
    "bathtub": ((0.0, 0.0, 0.0), (1.19, 0.56, 0.42)),
    "bedBunk": ((0.0, 0.0, 0.0), (0.57, 1.1, 0.85)),
    "bedDouble": ((0.0, 0.0, 0.0), (0.96, 1.12, 0.38)),
    "bedSingle": ((0.38, 0.0, 0.0), (0.96, 1.12, 0.38)),
    "chair": ((0.0, 0.0, 0.0), (0.2, 0.2, 0.47)),
    "desk": ((-0.01, -0.01, 0.0), (0.72, 0.38, 0.38)),
    "floorFull": ((0.0, 0.0, 0.0), (1.0, 1.0, 0.05)),
    "kitchenCoffeeMachine": ((0.0, 0.0, 0.0), (0.19, 0.24, 0.18)),
    "kitchenFridgeSmall": ((0.0, -0.01, 0.0), (0.43, 0.28, 0.6)),
    "lampRoundFloor": ((-0.02, -0.03, 0.0), (0.14, 0.15, 0.86)),
    "loungeSofa": ((0.0, 0.0, 0.0), (0.98, 0.41, 0.46)),
    "pottedPlant": ((-0.11, -0.12, 0.0), (0.11, 0.12, 0.65)),
    "rugRectangle": ((0.0, 0.0, 0.0), (1.57, 0.92, 0.01)),
    "shower": ((-0.56, -0.02, 0.0), (0.0, 0.56, 1.09)),
    "stoolBar": ((0.0, 0.0, 0.0), (0.27, 0.23, 0.44)),
    "table": ((0.0, 0.0, 0.0), (0.84, 0.45, 0.33)),
    "televisionModern": ((-0.34, -0.06, 0.0), (0.34, 0.06, 0.45)),
    "toilet": ((0.0, -0.48, 0.0), (0.31, 0.0, 0.45)),
    "wall": ((0.0, 0.0, 0.0), (1.0, 0.05, 1.29)),
    "wallCorner": ((0.0, 0.0, 0.0), (0.55, 0.55, 1.29)),
    "wallWindow": ((0.0, -0.02, 0.0), (1.0, 0.07, 1.29)),
}


def legs(width, depth, height, color, inset=0.04, size=0.05):
    return [block(f"leg{k}", x - size / 2, x + size / 2, y - size / 2, y + size / 2, 0, height, P[color])
            for k, (x, y) in enumerate(((-width / 2 + inset, -depth / 2 + inset), (width / 2 - inset, -depth / 2 + inset),
                                        (width / 2 - inset, depth / 2 - inset), (-width / 2 + inset, depth / 2 - inset)))]


def bed(width, bunk=False):
    """A bed whose headboard stands on +y; the bunk bed stacks a second one on posts."""
    def one(z, prefix):
        return [block(f"{prefix}frame", -width / 2, width / 2, -0.5, 0.5, z + 0.08, z + 0.2, P["wood"]),
                block(f"{prefix}mattress", -width / 2 + 0.03, width / 2 - 0.03, -0.47, 0.47, z + 0.2, z + 0.3, P["sheet"]),
                block(f"{prefix}cover", -width / 2 + 0.02, width / 2 - 0.02, -0.48, 0.15, z + 0.22, z + 0.32, P["fabric"]),
                block(f"{prefix}fold", -width / 2 + 0.02, width / 2 - 0.02, 0.12, 0.2, z + 0.24, z + 0.33, P["sheet"]),
                block(f"{prefix}pillow", -width / 2 + 0.08, width / 2 - 0.08, 0.27, 0.43, z + 0.3, z + 0.36, P["sheet"])]

    def build(rng):
        parts = one(0, "a") + [block("head", -width / 2, width / 2, 0.5, 0.56, 0, 0.5 if not bunk else 1.0, P["wood_dark"]),
                               block("foot", -width / 2, width / 2, -0.56, -0.5, 0, 0.28 if not bunk else 1.0, P["wood_dark"])]
        parts += legs(width, 1.0, 0.1, "wood_dark")
        if bunk:
            parts += one(0.5, "b")
            parts += [block(f"post{k}", x - 0.03, x + 0.03, y - 0.03, y + 0.03, 0, 1.0, P["wood_dark"])
                      for k, (x, y) in enumerate(((-width / 2, -0.53), (width / 2, -0.53), (width / 2, 0.53), (-width / 2, 0.53)))]
            parts += [block(f"rung{k}", width / 2 - 0.02, width / 2 + 0.02, -0.3, -0.26, 0.15 + 0.15 * k, 0.17 + 0.15 * k, P["wood"]) for k in range(4)]
        return parts
    return build


def bathtub(rng):
    return [block("outer", -0.6, 0.6, -0.28, 0.28, 0.05, 0.42, P["porcelain"]), block("water", -0.52, 0.52, -0.2, 0.2, 0.38, 0.39, P["glass"]),
            block("rim_in", -0.55, 0.55, -0.23, 0.23, 0.39, 0.41, P["porcelain"]), block("tap", 0.48, 0.56, -0.02, 0.02, 0.42, 0.5, P["chrome"])] + \
        [disc(f"foot{k}", 0.03, 0.05, (x, y, 0), P["chrome"], 6) for k, (x, y) in enumerate(((-0.5, -0.2), (0.5, -0.2), (0.5, 0.2), (-0.5, 0.2)))]


def chair(rng):
    return legs(0.4, 0.4, 0.45, "wood_dark") + [block("seat", -0.2, 0.2, -0.2, 0.2, 0.45, 0.5, P["wood"]),
                                                block("back", -0.2, 0.2, 0.16, 0.2, 0.5, 0.94, P["wood"]), block("rail", -0.18, 0.18, 0.165, 0.195, 0.75, 0.85, P["wood_dark"])]


def desk(rng):
    return [block("top", -0.36, 0.36, -0.19, 0.19, 0.34, 0.38, P["wood"]), block("drawers", 0.12, 0.34, -0.17, 0.17, 0, 0.34, P["wood_dark"]),
            block("drawer1", 0.14, 0.32, -0.18, -0.17, 0.2, 0.3, P["wood"]), block("drawer2", 0.14, 0.32, -0.18, -0.17, 0.05, 0.15, P["wood"]),
            block("leg_l", -0.34, -0.3, -0.17, 0.17, 0, 0.34, P["wood_dark"])]


def coffee_machine(rng):
    return [block("body", -0.09, 0.09, -0.06, 0.12, 0, 0.18, P["black"]), block("base", -0.09, 0.09, -0.12, -0.06, 0, 0.03, P["chrome"]),
            block("head", -0.06, 0.06, -0.1, -0.06, 0.12, 0.16, P["chrome"]), disc("mug", 0.03, 0.05, (0, -0.09, 0.03), P["porcelain"], 8)]


def fridge(rng):
    return [block("body", -0.21, 0.21, -0.13, 0.15, 0, 0.6, P["porcelain"]), block("line", -0.21, 0.21, -0.14, -0.13, 0.4, 0.41, P["metal"]),
            block("handle_top", 0.15, 0.17, -0.155, -0.135, 0.44, 0.56, P["chrome"]), block("handle_bottom", 0.15, 0.17, -0.155, -0.135, 0.25, 0.36, P["chrome"])]


def floor_lamp(rng):
    return [disc("base", 0.08, 0.02, (0, 0, 0), P["metal"], 10), block("pole", -0.008, 0.008, -0.008, 0.008, 0.02, 0.7, P["metal"]),
            lpm.prism("shade", 10, 0.08, 0.16, at=(0, 0, 0.7), color=P["lamp"], radius_top=0.05)]


def sofa(rng):
    return [block("base", -0.49, 0.49, -0.2, 0.2, 0.04, 0.24, P["fabric_dark"]), block("back", -0.49, 0.49, 0.1, 0.2, 0.24, 0.46, P["fabric_dark"]),
            block("arm_l", -0.49, -0.4, -0.2, 0.2, 0.24, 0.36, P["fabric_dark"]), block("arm_r", 0.4, 0.49, -0.2, 0.2, 0.24, 0.36, P["fabric_dark"]),
            block("cushion_l", -0.39, -0.01, -0.19, 0.1, 0.24, 0.3, P["fabric"]), block("cushion_r", 0.01, 0.39, -0.19, 0.1, 0.24, 0.3, P["fabric"])] + \
        legs(0.9, 0.36, 0.04, "wood_dark")


def potted_plant(rng):
    parts = [lpm.prism("pot", 8, 0.09, 0.2, color=P["pot"], radius_top=0.11), disc("soil", 0.1, 0.01, (0, 0, 0.19), P["wood_dark"], 8)]
    for k in range(6):
        leaf = lpm.box(f"leaf{k}", (0.03, 0.01, 0.42), color=P["leaf"], taper=(0.2, 1.0))
        lpm.rotate(leaf, 12 + 6 * (k % 2), "Y")
        lpm.rotate(leaf, 60 * k + rng.uniform(-10, 10), "Z")
        parts.append(lpm.move(leaf, 0, 0, 0.2))
    return parts


def rug(rng):
    return [block("border", -0.78, 0.78, -0.46, 0.46, 0, 0.01, P["rug_border"]), block("field", -0.72, 0.72, -0.4, 0.4, 0.001, 0.011, P["rug"])]


def shower(rng):
    """A corner shower cabinet: tray, two glass sides on -y and -x, its back walls on +y and +x."""
    return [block("tray", -0.28, 0.28, -0.28, 0.28, 0, 0.06, P["porcelain"]),
            block("back_y", -0.28, 0.28, 0.25, 0.28, 0.06, 1.09, P["porcelain"]), block("back_x", 0.25, 0.28, -0.28, 0.28, 0.06, 1.09, P["porcelain"]),
            block("glass_y", -0.28, 0.25, -0.28, -0.26, 0.06, 1.0, P["glass"]), block("glass_x", -0.28, -0.26, -0.26, 0.25, 0.06, 1.0, P["glass"]),
            block("pipe", 0.2, 0.22, 0.2, 0.22, 0.06, 0.95, P["chrome"]), disc("head", 0.05, 0.02, (0.15, 0.15, 0.93), P["chrome"], 8)]


def stool(rng):
    return [disc("seat", 0.13, 0.04, (0, 0, 0.4), P["fabric"], 10), block("pole", -0.02, 0.02, -0.02, 0.02, 0.03, 0.4, P["chrome"]),
            disc("base", 0.1, 0.03, (0, 0, 0), P["chrome"], 10), disc("ring", 0.08, 0.015, (0, 0, 0.18), P["chrome"], 10)]


def table(rng):
    return legs(0.84, 0.45, 0.29, "wood_dark") + [block("top", -0.42, 0.42, -0.225, 0.225, 0.29, 0.33, P["wood"])]


def television(rng):
    return [block("foot", -0.12, 0.12, -0.05, 0.05, 0, 0.02, P["black"]), block("neck", -0.02, 0.02, -0.01, 0.03, 0.02, 0.1, P["black"]),
            block("frame", -0.34, 0.34, -0.02, 0.02, 0.1, 0.45, P["black"]), block("screen", -0.32, 0.32, -0.025, -0.02, 0.12, 0.43, P["screen"])]


def toilet(rng):
    """The tank against the wall on +y, the bowl toward -y."""
    bowl = lpm.lathe("bowl", [(0.1, 0), (0.12, 0.2), (0.15, 0.3), (0.0, 0.3)], segments=10, at=(0, -0.1, 0), color=P["porcelain"])
    lpm.scale(bowl, 1, 1.3, 1, about=(0, -0.1, 0))
    return [bowl, block("seat", -0.14, 0.14, -0.3, 0.08, 0.3, 0.33, P["porcelain"]), block("tank", -0.15, 0.15, 0.08, 0.2, 0.25, 0.62, P["porcelain"]),
            block("button", -0.03, 0.03, 0.1, 0.16, 0.62, 0.63, P["chrome"])]


def thin_wall(rng, window=False):
    if not window:
        return [block("wall", 0, 1, 0, 0.05, 0, 1.29, P["wall"]), block("skirting", 0, 1, -0.01, 0.0, 0, 0.08, P["trim"]),
                block("cornice", 0, 1, -0.01, 0.0, 1.22, 1.29, P["trim"])]
    return [block("left", 0, 0.25, 0, 0.05, 0, 1.29, P["wall"]), block("right", 0.75, 1, 0, 0.05, 0, 1.29, P["wall"]),
            block("low", 0.25, 0.75, 0, 0.05, 0, 0.45, P["wall"]), block("high", 0.25, 0.75, 0, 0.05, 1.05, 1.29, P["wall"]),
            block("glass", 0.25, 0.75, 0.02, 0.03, 0.45, 1.05, P["glass"]), block("sill", 0.22, 0.78, -0.02, 0.07, 0.43, 0.46, P["trim"]),
            block("frame_l", 0.23, 0.26, -0.01, 0.06, 0.45, 1.05, P["trim"]), block("frame_r", 0.74, 0.77, -0.01, 0.06, 0.45, 1.05, P["trim"]),
            block("frame_t", 0.23, 0.77, -0.01, 0.06, 1.04, 1.07, P["trim"]), block("mullion", 0.49, 0.51, 0.015, 0.035, 0.45, 1.05, P["trim"])]


def thin_corner(rng):
    """An L of two thin wall arms: along x from the origin, and along y at x 0.55."""
    return [block("armx", 0, 0.55, 0, 0.05, 0, 1.29, P["wall"]), block("army", 0.5, 0.55, 0, 0.55, 0, 1.29, P["wall"])]


if __name__ == "__main__":
    export_all({
        "bathtub": bathtub, "bedBunk": bed(0.57, bunk=True), "bedDouble": bed(0.96), "bedSingle": bed(0.58), "chair": chair, "desk": desk,
        "floorFull": lambda rng: checker_floor(P, "floor", "floor_dark", height=0.05, cells=4, centered=False),
        "kitchenCoffeeMachine": coffee_machine, "kitchenFridgeSmall": fridge, "lampRoundFloor": floor_lamp, "loungeSofa": sofa,
        "pottedPlant": potted_plant, "rugRectangle": rug, "shower": shower, "stoolBar": stool, "table": table,
        "televisionModern": television, "toilet": toilet,
        "wall": thin_wall, "wallWindow": lambda rng: thin_wall(rng, window=True), "wallCorner": thin_corner,
    }, P, 600, HERE, boxes=BOXES, center=False, ground=False)
