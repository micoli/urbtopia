import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

MODEL_ID = "cherry-tree-1x1"
BUDGET = 1300

PALETTE = lpm.Palette([
    ("bark", "#6b4636", 0.0, 0.9),
    ("bark_dark", "#4e3226", 0.0, 0.9),
    ("leaf", "#5aa646", 0.0, 0.8),
    ("leaf_dark", "#3a7d37", 0.0, 0.8),
    ("blossom", "#ee8fb0", 0.0, 0.8),
    ("blossom_light", "#f7b9cf", 0.0, 0.8),
    ("cherry", "#b0102a", 0.0, 0.4),
    ("cherry_dark", "#7a0c20", 0.0, 0.4),
    ("stem", "#5b8a3a", 0.0, 0.9),
    ("soil", "#7a5230", 0.0, 1.0),
])

FORK_Z = 0.28
MAIN_TILT = 45
MAIN_LENGTH = 0.36
SECONDARY_TILT = 22
SECONDARY_LENGTH = 0.22
MAIN_YAWS = (10, 82, 154, 226, 298)
SECONDARY_OFFSETS = (-38, 38)
SECONDARY_COLORS = ("blossom", "leaf", "blossom_light", "leaf_dark", "blossom")
INNER_COLORS = ("leaf", "blossom", "leaf_dark", "blossom_light", "leaf")
HANGING_CHERRIES = {(0, 1), (2, 0), (3, 1), (4, 0)}


def direction(tilt, yaw):
    t, a = math.radians(tilt), math.radians(yaw)
    return (math.sin(t) * math.cos(a), math.sin(t) * math.sin(a), math.cos(t))


def branch(name, base, tilt, yaw, length, radius, radius_top):
    part = lpm.prism(name, 5, radius, length, color=PALETTE["bark"], radius_top=radius_top)
    lpm.rotate(part, tilt, "Y")
    lpm.rotate(part, yaw, "Z")
    lpm.move(part, *base)
    d = direction(tilt, yaw)
    tip = tuple(base[i] + length * d[i] for i in range(3))
    return part, tip


def cluster(name, radius, at, color):
    profile = [(0, -radius * 0.8), (radius * 0.75, -radius * 0.5), (radius, 0.05 * radius), (radius * 0.7, radius * 0.6), (0, radius * 0.85)]
    return lpm.lathe(name, profile, segments=6, at=at, color=PALETTE[color])


def cherry(name, at, color):
    r = 0.03
    profile = [(0, -r), (r, -r * 0.1), (r * 0.7, r * 0.7), (0, r * 0.8)]
    return lpm.lathe(name, profile, segments=5, at=at, color=PALETTE[color])


def cherry_pair(name, anchor, yaw):
    x, y, z = anchor
    stem_length = 0.06
    parts = [lpm.prism(f"{name}_stem", 3, 0.006, stem_length, at=(x, y, z - stem_length), color=PALETTE["stem"])]
    a = math.radians(yaw + 90)
    for i, side in enumerate((-1, 1)):
        at = (x + side * 0.022 * math.cos(a), y + side * 0.022 * math.sin(a), z - stem_length - 0.018)
        parts.append(cherry(f"{name}_{i}", at, "cherry" if side < 0 else "cherry_dark"))
    return parts


def make_parts():
    parts = []
    parts.append(lpm.prism("mound", 8, 0.15, 0.025, color=PALETTE["soil"], radius_top=0.11))
    parts.append(lpm.prism("flare", 8, 0.085, 0.06, at=(0, 0, 0.02), color=PALETTE["bark_dark"], radius_top=0.055))
    parts.append(lpm.prism("trunk", 8, 0.055, FORK_Z - 0.06, at=(0, 0, 0.08), color=PALETTE["bark"], radius_top=0.042))

    leader, leader_tip = branch("leader", (0, 0, FORK_Z - 0.02), 8, 200, 0.62, 0.036, 0.015)
    parts.append(leader)
    parts.append(cluster("crown", 0.13, (leader_tip[0], leader_tip[1], leader_tip[2] - 0.02), "blossom_light"))

    for i, yaw in enumerate(MAIN_YAWS):
        main, main_tip = branch(f"main{i}", (0, 0, FORK_Z), MAIN_TILT, yaw, MAIN_LENGTH, 0.03, 0.017)
        parts.append(main)
        parts.append(cluster(f"inner{i}", 0.11, (main_tip[0], main_tip[1], main_tip[2] + 0.02), INNER_COLORS[i % len(INNER_COLORS)]))
        for j, offset in enumerate(SECONDARY_OFFSETS):
            sub_yaw = yaw + offset
            sub, sub_tip = branch(f"sub{i}_{j}", main_tip, SECONDARY_TILT, sub_yaw, SECONDARY_LENGTH, 0.017, 0.008)
            parts.append(sub)
            color = SECONDARY_COLORS[(i + j) % len(SECONDARY_COLORS)]
            parts.append(cluster(f"bunch{i}_{j}", 0.11, (sub_tip[0], sub_tip[1], sub_tip[2] + 0.01), color))
            if (i, j) in HANGING_CHERRIES:
                anchor = (sub_tip[0] + 0.05 * math.cos(math.radians(sub_yaw)), sub_tip[1] + 0.05 * math.sin(math.radians(sub_yaw)), sub_tip[2] - 0.06)
                parts += cherry_pair(f"cherries{i}_{j}", anchor, sub_yaw)
    return parts


out_dir = os.path.dirname(os.path.abspath(__file__))
lpm.reset()
tree = lpm.finish(MODEL_ID, make_parts(), PALETTE, budget=BUDGET, center=False)
lpm.export_glb(tree, os.path.join(out_dir, MODEL_ID))
