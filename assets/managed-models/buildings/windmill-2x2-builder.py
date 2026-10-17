import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

MODEL_ID = "windmill-2x2"
TIERS = 5
BUDGET = 1500

PALETTE = lpm.Palette([
    ("stone", "#9a9082", 0.0, 0.95),
    ("stone_light", "#b3a994", 0.0, 0.95),
    ("stone_dark", "#756c60", 0.0, 0.95),
    ("roof", "#4d4642", 0.0, 0.9),
    ("wood", "#7a5232", 0.0, 0.9),
    ("wood_dark", "#3e2a1a", 0.0, 0.9),
    ("sail", "#f4f3ee", 0.0, 0.8),
    ("sail_rib", "#c7c4b8", 0.0, 0.8),
    ("dark", "#2a2a30", 0.0, 0.7),
    ("flour", "#ece3cf", 0.0, 0.95),
    ("flour_tie", "#b9a57a", 0.0, 0.95),
])

SIDES = 12
FACE_ROTATE = 15
BASE_Z = 0.06
TOWER_HEIGHT = 1.15
TOWER_R_BOTTOM = 0.60
TOWER_R_TOP = 0.42
CAP_HEIGHT = 0.55
HUB_Z = 1.30
HUB_Y = -0.60
SAIL_LENGTH = 0.98
SAIL_TILT = 15


def tower_radius(z):
    return TOWER_R_BOTTOM + (TOWER_R_TOP - TOWER_R_BOTTOM) * (z - BASE_Z) / TOWER_HEIGHT


def apothem(z):
    return tower_radius(z) * math.cos(math.radians(FACE_ROTATE))


def tower_parts():
    parts = []
    parts.append(lpm.prism("plinth", SIDES, 0.64, BASE_Z, rotate=FACE_ROTATE, color=PALETTE["stone_dark"]))
    tower = lpm.prism("tower", SIDES, TOWER_R_BOTTOM, TOWER_HEIGHT, at=(0, 0, BASE_Z), radius_top=TOWER_R_TOP,
                      rotate=FACE_ROTATE, color=PALETTE["stone"])
    lpm.paint(tower, PALETTE["stone_light"], where=lambda c, n, i: i % 3 == 0 and abs(n.z) < 0.5)
    parts.append(tower)
    for i, z in enumerate((0.30, 0.55, 0.80, 1.05)):
        parts.append(lpm.prism(f"course{i}", SIDES, tower_radius(z) + 0.008, 0.03, at=(0, 0, z), rotate=FACE_ROTATE,
                               color=PALETTE["stone_dark"]))
    return parts


def cap_parts():
    top = BASE_Z + TOWER_HEIGHT
    parts = [
        lpm.prism("cap_lip", SIDES, 0.54, 0.04, at=(0, 0, top - 0.02), rotate=FACE_ROTATE, color=PALETTE["roof"]),
        lpm.prism("cap", SIDES, 0.52, CAP_HEIGHT, at=(0, 0, top + 0.02), radius_top=0.03, rotate=FACE_ROTATE,
                  color=PALETTE["roof"]),
        lpm.prism("finial", 6, 0.03, 0.08, at=(0, 0, top + 0.02 + CAP_HEIGHT), color=PALETTE["wood_dark"]),
    ]
    return parts


def door_parts():
    y = -(apothem(0.2) - 0.003)
    z = BASE_Z
    frame_box = lpm.box("door_frame", (0.28, 0.045, 0.28), at=(0, y, z), color=PALETTE["stone_dark"])
    frame_arch = lpm.prism("door_frame_arch", 8, 0.14, 0.045, color=PALETTE["stone_dark"])
    door_box = lpm.box("door", (0.22, 0.05, 0.26), at=(0, y - 0.005, z), color=PALETTE["wood_dark"])
    door_arch = lpm.prism("door_arch", 8, 0.11, 0.05, color=PALETTE["wood_dark"])
    for arch, dy in ((frame_arch, y + 0.0225), (door_arch, y + 0.02)):
        lpm.rotate(arch, 90, "X")
        lpm.move(arch, 0, dy, z + 0.28 if arch is frame_arch else z + 0.26)
    return [frame_box, frame_arch, door_box, door_arch]


def window_parts():
    z = 0.70
    a = apothem(z + 0.07)
    return [
        lpm.box("window_right", (0.03, 0.06, 0.14), at=(a, 0, z), color=PALETTE["dark"]),
        lpm.box("window_left", (0.03, 0.06, 0.14), at=(-a, 0, z), color=PALETTE["dark"]),
        lpm.box("window_back", (0.06, 0.03, 0.14), at=(0, a, z), color=PALETTE["dark"]),
        lpm.box("window_front", (0.06, 0.03, 0.14), at=(0, -apothem(0.97), 0.90), color=PALETTE["dark"]),
    ]


def hub_parts():
    shaft = lpm.prism("shaft", 8, 0.06, 0.26, color=PALETTE["wood_dark"])
    lpm.rotate(shaft, 90, "X")
    lpm.move(shaft, 0, -0.36, HUB_Z)
    boss = lpm.prism("boss", 8, 0.09, 0.05, color=PALETTE["wood"])
    lpm.rotate(boss, 90, "X")
    lpm.move(boss, 0, HUB_Y - 0.02, HUB_Z)
    return [shaft, boss]


def sail_arm(index):
    y = HUB_Y - 0.04
    parts = [
        lpm.box("stock", (0.035, 0.035, SAIL_LENGTH), at=(0, y, HUB_Z), color=PALETTE["wood"]),
        lpm.box("panel", (0.22, 0.012, 0.74), at=(0.13, y - 0.02, HUB_Z + 0.22), color=PALETTE["sail"]),
    ]
    for k in range(5):
        parts.append(lpm.box("rib", (0.22, 0.012, 0.012), at=(0.13, y - 0.028, HUB_Z + 0.26 + k * 0.14), color=PALETTE["sail_rib"]))
    for part in parts:
        lpm.rotate(part, SAIL_TILT + 90 * index, "Y", about=(0, y, HUB_Z))
    return parts


SACKS = [
    # (x, y, yaw deg)
    (0.31, -0.70, 15),
    (-0.31, -0.70, -20),
    (0.63, -0.36, 40),
    (-0.65, -0.34, -35),
    (0.56, 0.31, 10),
]


def sack_parts(index, x, y, yaw):
    body = lpm.box(f"sack{index}", (0.16, 0.11, 0.13), at=(0, 0, 0), color=PALETTE["flour"], taper=(0.75, 0.8))
    neck = lpm.box(f"sack_neck{index}", (0.07, 0.05, 0.03), at=(0, 0, 0.13), color=PALETTE["flour_tie"])
    for part in (body, neck):
        lpm.rotate(part, yaw, "Z")
        lpm.move(part, x, y, 0)
    return [body, neck]


def make_parts(tier):
    parts = tower_parts() + cap_parts() + door_parts() + window_parts() + hub_parts()
    for index, (x, y, yaw) in enumerate(SACKS[:tier]):
        parts += sack_parts(index, x, y, yaw)
    for index in range(4):
        parts += sail_arm(index)
    return parts


buildings_dir = os.path.dirname(os.path.abspath(__file__))
for tier in range(1, TIERS + 1):
    model_id = f"{MODEL_ID}-t{tier}"
    lpm.reset()
    windmill = lpm.finish(model_id, make_parts(tier), PALETTE, budget=BUDGET, center=False)
    lpm.export_glb(windmill, os.path.join(buildings_dir, model_id, model_id))
