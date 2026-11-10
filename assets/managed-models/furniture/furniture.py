import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, fillet, lpm  # noqa: E402
from venue_lib import along, block, checker_floor, disc  # noqa: E402

P = lpm.Palette([
    ("wall", "#f1ebe0", 0.0, 0.9), ("trim", "#c9b79c", 0.0, 0.9), ("floor", "#d8b98e", 0.0, 0.8), ("floor_dark", "#c4a276", 0.0, 0.8),
    ("wood", "#b98656", 0.0, 0.8), ("wood_dark", "#8a5d36", 0.0, 0.8), ("fabric", "#e58a7a", 0.0, 0.95), ("fabric_dark", "#c96b5c", 0.0, 0.95),
    ("sheet", "#f6f2ea", 0.0, 0.95), ("blue", "#6a8fc8", 0.0, 0.9), ("porcelain", "#f4f6f8", 0.0, 0.3), ("chrome", "#b8c0cc", 0.6, 0.3),
    ("glass", "#cfeefa", 0.0, 0.2), ("black", "#2a2d3a", 0.0, 0.5), ("screen", "#3a4a6a", 0.0, 0.2), ("lamp", "#ffe2a0", 0.0, 0.5, 1.5),
    ("leaf", "#5aa646", 0.0, 0.8), ("pot", "#cf6a40", 0.0, 0.8), ("rug", "#7a9bd0", 0.0, 1.0), ("rug_border", "#e3c46a", 0.0, 1.0),
    ("metal", "#9aa1ab", 0.5, 0.4),
    ("cabinet", "#c9a77c", 0.0, 0.8), ("cabinet_dark", "#a07f55", 0.0, 0.8), ("counter", "#e9e4d8", 0.0, 0.5),
    ("crt_shell", "#b9a98c", 0.0, 0.7), ("crt_screen", "#6f8f86", 0.0, 0.2), ("crt_glare", "#a9c7bc", 0.0, 0.2), ("knob", "#3b3d46", 0.0, 0.5),
    ("book_red", "#b8453a", 0.0, 0.9), ("book_blue", "#3f6fb0", 0.0, 0.9), ("book_green", "#4f8f5a", 0.0, 0.9), ("book_yellow", "#e0b84a", 0.0, 0.9),
    ("book_cream", "#eadfc6", 0.0, 0.9), ("frame_gold", "#d9a93a", 0.6, 0.4), ("canvas", "#f4efe2", 0.0, 0.9),
    ("sky", "#8fc4e8", 0.0, 0.9), ("hill", "#6fae5a", 0.0, 0.9), ("hill_dark", "#4e8a45", 0.0, 0.9), ("sun", "#f6d34a", 0.0, 0.9),
    ("sea", "#3f78b8", 0.0, 0.9), ("coral", "#e2705a", 0.0, 0.9), ("plum", "#7a4f8f", 0.0, 0.9),
    ("light_a", "#e6c79a", 0.0, 0.8), ("light_b", "#d8b685", 0.0, 0.8), ("honey_a", "#c98f4e", 0.0, 0.8), ("honey_b", "#b8803f", 0.0, 0.8),
    ("walnut_a", "#7a4a2b", 0.0, 0.8), ("walnut_b", "#6a3e24", 0.0, 0.8), ("ebony_a", "#38332f", 0.0, 0.8), ("ebony_b", "#2a2624", 0.0, 0.8),
])

# Bounding boxes of the Kenney models these replace, in Blender axes (front on -y).
BOXES = {
    "bathtub": ((0.0, 0.0, 0.0), (1.19, 0.56, 0.42)),
    "bedBunk": ((0.0, 0.0, 0.0), (0.57, 1.1, 0.85)),
    "bedDouble": ((0.0, 0.0, 0.0), (0.96, 1.12, 0.38)),
    "bedSingle": ((0.38, 0.0, 0.0), (0.96, 1.12, 0.38)),
    "desk": ((-0.01, -0.01, 0.0), (0.72, 0.38, 0.38)),
    "floorFull": ((0.0, 0.0, 0.0), (1.0, 1.0, 0.05)),
    "floorParquetLight": ((0.0, 0.0, 0.0), (1.0, 1.0, 0.05)), "floorParquetHoney": ((0.0, 0.0, 0.0), (1.0, 1.0, 0.05)),
    "floorParquetWalnut": ((0.0, 0.0, 0.0), (1.0, 1.0, 0.05)), "floorParquetEbony": ((0.0, 0.0, 0.0), (1.0, 1.0, 0.05)),
    "kitchenCoffeeMachine": ((0.0, 0.0, 0.0), (0.19, 0.24, 0.18)),
    "kitchenFridgeSmall": ((0.0, -0.01, 0.0), (0.43, 0.28, 0.6)),
    "lampRoundFloor": ((-0.02, -0.03, 0.0), (0.14, 0.15, 0.86)),
    "loungeSofa": ((0.0, 0.0, 0.0), (0.98, 0.41, 0.46)),
    "pottedPlant": ((-0.11, -0.12, 0.0), (0.11, 0.12, 0.65)),
    "shower": ((-0.56, -0.02, 0.0), (0.0, 0.56, 1.09)),
    "stoolBar": ((0.0, 0.0, 0.0), (0.27, 0.23, 0.44)),
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
    """A hollow tub: a floor, four walls around a basin, the water below the rim, the tap on +x."""
    wall = 0.07
    return [block("bottom", -0.6, 0.6, -0.28, 0.28, 0.05, 0.12, P["porcelain"]),
            block("side_back", -0.6, 0.6, 0.28 - wall, 0.28, 0.12, 0.42, P["porcelain"]), block("side_front", -0.6, 0.6, -0.28, -0.28 + wall, 0.12, 0.42, P["porcelain"]),
            block("end_l", -0.6, -0.6 + wall, -0.28 + wall, 0.28 - wall, 0.12, 0.42, P["porcelain"]), block("end_r", 0.6 - wall, 0.6, -0.28 + wall, 0.28 - wall, 0.12, 0.42, P["porcelain"]),
            block("water", -0.6 + wall, 0.6 - wall, -0.28 + wall, 0.28 - wall, 0.12, 0.3, P["glass"]),
            block("tap", 0.48, 0.56, -0.02, 0.02, 0.42, 0.5, P["chrome"])] + \
        [disc(f"foot{k}", 0.03, 0.05, (x, y, 0), P["chrome"], 6) for k, (x, y) in enumerate(((-0.5, -0.2), (0.5, -0.2), (0.5, 0.2), (-0.5, 0.2)))]


def chair(rng):
    """Faces -y, drawn forward in its tile, the front legs on the front edge of the 1x1 footprint, so that it sits against the table in front of it."""
    parts = legs(0.4, 0.4, 0.45, "wood_dark") + [block("seat", -0.2, 0.2, -0.2, 0.2, 0.45, 0.5, P["wood"]),
                                                block("back", -0.2, 0.2, 0.16, 0.2, 0.5, 0.94, P["wood"]), block("rail", -0.18, 0.18, 0.165, 0.195, 0.75, 0.85, P["wood_dark"])]
    return [lpm.move(part, 0, -0.31, 0) for part in parts]


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


def sofa_wide(rng):
    """A two-seat sofa of 2 tiles by 1, as high as the armchair: back on +y, arms and cushions on a seat of 0.28."""
    parts = [block("seat", -0.95, 0.95, -0.38, 0.4, 0.12, 0.28, P["fabric_dark"]), block("back", -0.95, 0.95, 0.24, 0.4, 0.12, 0.64, P["fabric_dark"]),
             block("arm_l", -0.95, -0.82, -0.38, 0.4, 0.12, 0.42, P["fabric_dark"]), block("arm_r", 0.82, 0.95, -0.38, 0.4, 0.12, 0.42, P["fabric_dark"]),
             block("cushion_l", -0.8, -0.01, -0.36, 0.22, 0.28, 0.34, P["fabric"]), block("cushion_r", 0.01, 0.8, -0.36, 0.22, 0.28, 0.34, P["fabric"]),
             block("pillow_l", -0.78, -0.5, 0.1, 0.22, 0.34, 0.54, P["fabric"]), block("pillow_r", 0.5, 0.78, 0.1, 0.22, 0.34, 0.54, P["fabric"])]
    for k, (x, y) in enumerate(((-0.9, -0.33), (0.9, -0.33), (0.9, 0.35), (-0.9, 0.35))):
        parts.append(block(f"leg{k}", x - 0.025, x + 0.025, y - 0.025, y + 0.025, 0.0, 0.12, P["wood_dark"]))
    return parts


def potted_plant(rng):
    parts = [lpm.prism("pot", 8, 0.09, 0.2, color=P["pot"], radius_top=0.11), disc("soil", 0.1, 0.01, (0, 0, 0.19), P["wood_dark"], 8)]
    for k in range(6):
        leaf = lpm.box(f"leaf{k}", (0.03, 0.01, 0.42), color=P["leaf"], taper=(0.2, 1.0))
        lpm.rotate(leaf, 12 + 6 * (k % 2), "Y")
        lpm.rotate(leaf, 60 * k + rng.uniform(-10, 10), "Z")
        parts.append(lpm.move(leaf, 0, 0, 0.2))
    return parts


def rug(rng):
    """A rug of 2 tiles by 1 that lies on the floor, whose top is at 0.05."""
    return [block("border", -0.95, 0.95, -0.5, 0.5, 0.05, 0.06, P["rug_border"]), block("field", -0.89, 0.89, -0.44, 0.44, 0.051, 0.061, P["rug"])]


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
    """A table whose top, at 0.72, is above the seat of the chair, 0.9 by 0.6, centred on its tile."""
    return legs(0.9, 0.6, 0.68, "wood_dark", inset=0.05, size=0.06) + [block("top", -0.45, 0.45, -0.3, 0.3, 0.68, 0.72, P["wood"])]


def television(rng):
    return [block("foot", -0.12, 0.12, -0.05, 0.05, 0, 0.02, P["black"]), block("neck", -0.02, 0.02, -0.01, 0.03, 0.02, 0.1, P["black"]),
            block("frame", -0.34, 0.34, -0.02, 0.02, 0.1, 0.45, P["black"]), block("screen", -0.32, 0.32, -0.025, -0.02, 0.12, 0.43, P["screen"])]


def toilet(rng):
    """The tank against the wall on +y, the bowl toward -y."""
    bowl = lpm.lathe("bowl", [(0.1, 0), (0.12, 0.2), (0.15, 0.3), (0.0, 0.3)], segments=10, at=(0, -0.1, 0), color=P["porcelain"])
    lpm.scale(bowl, 1, 1.3, 1, about=(0, -0.1, 0))
    return [bowl, block("seat", -0.14, 0.14, -0.3, 0.08, 0.3, 0.33, P["porcelain"]), block("tank", -0.15, 0.15, 0.08, 0.2, 0.25, 0.62, P["porcelain"]),
            block("button", -0.03, 0.03, 0.1, 0.16, 0.62, 0.63, P["chrome"])]


def thin_wall(rng):
    return [block("wall", 0, 1, 0, 0.05, 0, 1.29, P["wall"]), block("skirting", 0, 1, -0.01, 0.0, 0, 0.08, P["trim"]),
            block("cornice", 0, 1, -0.01, 0.0, 1.22, 1.29, P["trim"])]


WALL_H = 1.29
HALF = 0.025


LOW_WALL_H = 0.64


def _trim_strips(arms, top=WALL_H):
    """Skirting and cornice on both faces of every arm and around the centre square on the sides without an arm."""
    t = 0.01
    parts = []
    for z0, z1 in ((0.0, 0.08), (top - 0.07, top)):
        for side in "ESWN":
            if side in arms:
                parts += [along(side, HALF, 0.5, o0, o1, z0, z1, P["trim"], f"trim{side}{z0}{k}") for k, (o0, o1) in enumerate(((HALF, HALF + t), (-HALF - t, -HALF)))]
                continue
            parts.append(along(side, HALF, HALF + t, -HALF - t, HALF + t, z0, z1, P["trim"], f"trim_end{side}{z0}"))
    return parts


def partition_junction(arms, height=WALL_H):
    """The centre of thin walls that meet, with arms to the given sides (E, S, W, N), as an elbow, a T or a cross."""
    def build(rng):
        parts = [block("centre", -HALF, HALF, -HALF, HALF, 0, height, P["wall"])]
        parts += [along(side, HALF, 0.5, -HALF, HALF, 0, height, P["wall"], f"arm{side}") for side in arms]
        return parts + _trim_strips(arms, height)
    return build


def partition(rng):
    """A thin wall centred on its tile, so that neighbours join into corners, Ts and crosses."""
    return [block("wall", -0.5, 0.5, -HALF, HALF, 0, WALL_H, P["wall"])] + _trim_strips("EW")


def partition_low(rng):
    """A half-height wall: the same thin wall, as high as a counter, so that a room is divided without being closed."""
    return [block("wall", -0.5, 0.5, -HALF, HALF, 0, LOW_WALL_H, P["wall"])] + _trim_strips("EW", LOW_WALL_H)


def partition_window(rng):
    h = HALF
    return [block("left", -0.5, -0.25, -h, h, 0, WALL_H, P["wall"]), block("right", 0.25, 0.5, -h, h, 0, WALL_H, P["wall"]),
            block("low", -0.25, 0.25, -h, h, 0, 0.45, P["wall"]), block("high", -0.25, 0.25, -h, h, 1.05, WALL_H, P["wall"]),
            block("glass", -0.25, 0.25, -0.005, 0.005, 0.45, 1.05, P["glass"]), block("sill", -0.28, 0.28, -0.045, 0.045, 0.43, 0.46, P["trim"]),
            block("frame_l", -0.27, -0.24, -0.035, 0.035, 0.45, 1.05, P["trim"]), block("frame_r", 0.24, 0.27, -0.035, 0.035, 0.45, 1.05, P["trim"]),
            block("frame_t", -0.27, 0.27, -0.035, 0.035, 1.04, 1.07, P["trim"]), block("mullion", -0.01, 0.01, -0.01, 0.01, 0.45, 1.05, P["trim"])] + _trim_strips("EW")


def partition_door(rng):
    """A full-height thin wall with an open doorway, framed, a lintel above it."""
    h = HALF
    return [block("left", -0.5, -0.2, -h, h, 0, WALL_H, P["wall"]), block("right", 0.2, 0.5, -h, h, 0, WALL_H, P["wall"]),
            block("lintel", -0.2, 0.2, -h, h, 1.0, WALL_H, P["wall"]),
            block("frame_l", -0.23, -0.2, -0.035, 0.035, 0, 1.0, P["trim"]), block("frame_r", 0.2, 0.23, -0.035, 0.035, 0, 1.0, P["trim"]),
            block("frame_t", -0.23, 0.23, -0.035, 0.035, 0.97, 1.03, P["trim"])] + _trim_strips("EW")


def thin_corner(rng):
    """An L of two thin wall arms: along x from the origin, and along y at x 0.55."""
    return [block("armx", 0, 0.55, 0, 0.05, 0, 1.29, P["wall"]), block("army", 0.5, 0.55, 0, 0.55, 0, 1.29, P["wall"])]


def sink_cabinet(rng):
    """A kitchen base cabinet with a sink on its top, as big as the restaurant cooktop: the splashback and the tap against the wall on +y."""
    return [block("plinth", -0.41, 0.41, -0.38, 0.32, 0, 0.06, P["cabinet_dark"]), block("body", -0.43, 0.43, -0.4, 0.34, 0.06, 0.5, P["cabinet"]),
            block("door_l", -0.41, -0.01, -0.41, -0.4, 0.1, 0.46, P["cabinet_dark"]), block("door_r", 0.01, 0.41, -0.41, -0.4, 0.1, 0.46, P["cabinet_dark"]),
            block("handle_l", -0.1, -0.06, -0.44, -0.41, 0.26, 0.38, P["chrome"]), block("handle_r", 0.06, 0.1, -0.44, -0.41, 0.26, 0.38, P["chrome"]),
            block("top", -0.43, 0.43, -0.4, 0.34, 0.5, 0.54, P["counter"]), block("basin", -0.27, 0.27, -0.3, 0.2, 0.54, 0.55, P["chrome"]),
            block("backsplash", -0.43, 0.43, 0.34, 0.4, 0.0, 0.85, P["counter"]),
            block("tap_post", -0.02, 0.02, 0.2, 0.26, 0.54, 0.7, P["chrome"]), block("tap_spout", -0.015, 0.015, 0.05, 0.26, 0.66, 0.7, P["chrome"])]


def television_crt(rng):
    """A 1960s cathodic television: rounded cream shell with a bulging screen on a low cabinet with splayed legs, rabbit-ear antenna."""
    def rounded(name, x0, x1, y0, y1, z0, z1, color, width, segments=2):
        return fillet(block(name, x0, x1, y0, y1, z0, z1, P[color]), width, segments)

    parts = [rounded("cabinet", -0.3, 0.3, -0.16, 0.16, 0.1, 0.27, "cabinet", 0.03, 1),
             block("door_inset", -0.25, 0.0, -0.172, -0.158, 0.13, 0.24, P["cabinet_dark"]), block("speaker", 0.05, 0.26, -0.172, -0.158, 0.13, 0.24, P["black"]),
             rounded("shell", -0.25, 0.25, -0.14, 0.12, 0.27, 0.6, "crt_shell", 0.07),
             rounded("tube", -0.17, 0.17, 0.1, 0.24, 0.33, 0.54, "crt_shell", 0.05, 1),
             rounded("bezel", -0.21, 0.09, -0.152, -0.12, 0.31, 0.57, "black", 0.05, 1),
             rounded("screen", -0.19, 0.07, -0.158, -0.14, 0.33, 0.55, "crt_screen", 0.045),
             block("glare", -0.16, -0.09, -0.16, -0.158, 0.47, 0.52, P["crt_glare"]),
             block("knob_a", 0.13, 0.19, -0.16, -0.14, 0.46, 0.5, P["knob"]), block("knob_b", 0.13, 0.19, -0.16, -0.14, 0.38, 0.42, P["knob"]),
             disc("antenna_base", 0.04, 0.02, (0, 0.0, 0.6), P["black"], 8),
             lpm.move(lpm.rotate(lpm.box("ear_l", (0.012, 0.012, 0.3), at=(0, 0, 0.0), color=P["metal"]), 28, "Y"), 0, 0, 0.62),
             lpm.move(lpm.rotate(lpm.box("ear_r", (0.012, 0.012, 0.3), at=(0, 0, 0.0), color=P["metal"]), -28, "Y"), 0, 0, 0.62)]
    for k, (x, y, dx, dy) in enumerate(((-0.25, -0.12, -0.04, -0.03), (0.25, -0.12, 0.04, -0.03), (0.25, 0.12, 0.04, 0.03), (-0.25, 0.12, -0.04, 0.03))):
        leg = lpm.box(f"leg{k}", (0.035, 0.035, 0.12), at=(0, 0, 0), color=P["wood_dark"])
        lpm.rotate(leg, 12 * (1 if dx > 0 else -1), "Y")
        lpm.rotate(leg, 12 * (1 if dy > 0 else -1), "X")
        parts.append(lpm.move(leg, x + dx / 2, y + dy / 2, 0))
    return parts


def bookcase(rng):
    """A bookcase, open on -y, with three shelves of books, its back on the edge of the tile on +y so that it stands flush against a wall."""
    parts = [block("side_l", -0.25, -0.23, -0.1, 0.1, 0, 0.9, P["wood"]), block("side_r", 0.23, 0.25, -0.1, 0.1, 0, 0.9, P["wood"]),
             block("back", -0.23, 0.23, 0.08, 0.1, 0.02, 0.9, P["wood_dark"]), block("top", -0.26, 0.26, -0.11, 0.11, 0.9, 0.93, P["wood"]),
             block("base", -0.23, 0.23, -0.1, 0.1, 0, 0.04, P["wood_dark"])]
    colors = ["book_red", "book_blue", "book_green", "book_yellow", "book_cream"]
    for level, plank in enumerate((0.04, 0.28, 0.56)):
        floor = plank if level == 0 else plank + 0.025
        if level:
            parts.append(block(f"shelf{level}", -0.23, 0.23, -0.1, 0.08, plank, plank + 0.025, P["wood"]))
        x = -0.2
        for k in range(5):
            width = 0.025 + 0.012 * ((k + level) % 3)
            height = 0.17 + 0.03 * ((k * 2 + level) % 3)
            parts.append(block(f"book{level}{k}", x, x + width, -0.07, 0.06, floor, floor + height, P[colors[(k + level) % 5]]))
            x += width + 0.004
    parts.append(block("shelf3", -0.23, 0.23, -0.1, 0.08, 0.84, 0.865, P["wood"]))
    return [lpm.move(part, 0, 0.35, 0) for part in parts]


def coffee_table(rng):
    return legs(0.5, 0.3, 0.16, "wood_dark", inset=0.03, size=0.035) + [block("top", -0.25, 0.25, -0.15, 0.15, 0.16, 0.19, P["wood"]),
                                                                       block("under", -0.22, 0.22, -0.12, 0.12, 0.06, 0.08, P["wood_dark"])]


def _framed(width, height, canvas_parts):
    """A painting that hangs on the wall on y 0: its back on the wall, its face toward -y, centred on x, its centre at two thirds of the wall height."""
    def build(rng):
        cx, z0 = 0.0, WALL_H * 2 / 3 - height / 2
        t = 0.025
        parts = [block("frame_b", -width / 2, width / 2, -0.03, 0, z0, z0 + t, P["frame_gold"]), block("frame_t", -width / 2, width / 2, -0.03, 0, z0 + height - t, z0 + height, P["frame_gold"]),
                 block("frame_l", -width / 2, -width / 2 + t, -0.03, 0, z0 + t, z0 + height - t, P["frame_gold"]),
                 block("frame_r", width / 2 - t, width / 2, -0.03, 0, z0 + t, z0 + height - t, P["frame_gold"]),
                 block("canvas", -width / 2 + t, width / 2 - t, -0.02, 0, z0 + t, z0 + height - t, P["canvas"])]
        return parts + canvas_parts(cx, z0 + t, width - 2 * t, height - 2 * t)
    return build


def _paint(name, x0, x1, z0, z1, color):
    return block(name, x0, x1, -0.026, -0.02, z0, z1, P[color])


def landscape(cx, z, w, h):
    return [_paint("sky", -w / 2, w / 2, z + h * 0.4, z + h, "sky"), _paint("hill_far", -w / 2, w / 2, z, z + h * 0.45, "hill_dark"),
            _paint("hill_near", -w / 2, w * 0.15, z, z + h * 0.3, "hill"), _paint("sun", w * 0.12, w * 0.3, z + h * 0.65, z + h * 0.85, "sun")]


def seascape(cx, z, w, h):
    return [_paint("sky", -w / 2, w / 2, z + h * 0.45, z + h, "sky"), _paint("sea", -w / 2, w / 2, z, z + h * 0.5, "sea"),
            _paint("boat", -w * 0.2, w * 0.1, z + h * 0.45, z + h * 0.6, "coral"), _paint("sail", -w * 0.1, -w * 0.02, z + h * 0.6, z + h * 0.85, "canvas")]


def abstract(cx, z, w, h):
    return [_paint("a", -w / 2, -w * 0.05, z, z + h * 0.6, "coral"), _paint("b", -w * 0.05, w / 2, z + h * 0.4, z + h, "plum"),
            _paint("c", w * 0.1, w / 2, z, z + h * 0.35, "book_yellow"), _paint("d", -w / 2, -w * 0.25, z + h * 0.65, z + h, "sea")]


def parquet(tone):
    """A floor tile of four rows of planks, the joints of a row half a plank away from those of the next."""
    def build(rng):
        parts = []
        for row in range(4):
            cuts = [0.0, 0.5, 1.0] if row % 2 == 0 else [0.0, 0.25, 0.75, 1.0]
            for k in range(len(cuts) - 1):
                parts.append(block(f"p{row}{k}", cuts[k], cuts[k + 1] - 0.004, row * 0.25, (row + 1) * 0.25 - 0.004, 0, 0.05, P[f"{tone}_{'a' if (row + k) % 2 == 0 else 'b'}"]))
        return parts
    return build


if __name__ == "__main__":
    export_all({
        "bathtub": bathtub, "bedBunk": bed(0.57, bunk=True), "bedDouble": bed(0.96), "bedSingle": bed(0.58), "chair": chair, "desk": desk,
        "floorParquetLight": parquet("light"), "floorParquetHoney": parquet("honey"), "floorParquetWalnut": parquet("walnut"), "floorParquetEbony": parquet("ebony"),
        "floorFull": lambda rng: checker_floor(P, "floor", "floor_dark", height=0.05, cells=4, centered=False),
        "kitchenCoffeeMachine": coffee_machine, "kitchenFridgeSmall": fridge, "lampRoundFloor": floor_lamp, "loungeSofa": sofa,
        "pottedPlant": potted_plant, "rugRectangle": rug, "shower": shower, "stoolBar": stool, "table": table,
        "televisionModern": television, "toilet": toilet,
        "kitchenSinkCabinet": sink_cabinet, "televisionCrt": television_crt, "bookcase": bookcase, "coffeeTable": coffee_table,
        "paintingLandscape": _framed(0.36, 0.26, landscape), "paintingSeascape": _framed(0.26, 0.36, seascape), "paintingAbstract": _framed(0.3, 0.3, abstract),
        "wall": thin_wall, "wallCorner": thin_corner,
        "partition": partition, "partitionDoor": partition_door, "partitionWindow": partition_window, "partitionElbow": partition_junction("ES"), "partitionTee": partition_junction("WES"), "partitionCross": partition_junction("ESWN"),
        "partitionLow": partition_low, "partitionLowElbow": partition_junction("ES", LOW_WALL_H), "partitionLowTee": partition_junction("WES", LOW_WALL_H), "partitionLowCross": partition_junction("ESWN", LOW_WALL_H),
        "loungeSofaWide": sofa_wide,
    }, P, 600, HERE, boxes=BOXES, center=False, ground=False)
