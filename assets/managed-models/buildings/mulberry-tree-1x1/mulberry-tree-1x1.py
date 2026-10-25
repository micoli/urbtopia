import math
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.insert(0, os.path.join(REPO, "tools", "blender"))
import lpm  # noqa: E402

MODEL_ID = "mulberry-tree-1x1"
BUDGET = 1800

PALETTE = lpm.Palette([
    ("bark", "#6e5a48", 0.0, 0.9),
    ("bark_dark", "#4d3f33", 0.0, 0.9),
    ("leaf", "#58a03e", 0.0, 0.8),
    ("leaf_dark", "#2f7234", 0.0, 0.8),
    ("leaf_light", "#86c75a", 0.0, 0.8),
    ("berry", "#5a1f70", 0.0, 0.4),
    ("berry_red", "#b02a50", 0.0, 0.4),
    ("cocoon", "#f5f0de", 0.0, 0.9),
    ("stem", "#5b8a3a", 0.0, 0.9),
    ("soil", "#7a5230", 0.0, 1.0),
])

FORK_Z = 0.22
MAIN_TILT = 58
MAIN_LENGTH = 0.34
SECONDARY_TILT = 30
SECONDARY_LENGTH = 0.2
MAIN_YAWS = (20, 92, 164, 236, 308)
SECONDARY_OFFSETS = (-40, 40)
CROWN_COLORS = ("leaf", "leaf_dark", "leaf_light", "leaf", "leaf_dark")
BUNCH_COLORS = ("leaf_light", "leaf", "leaf_dark", "leaf_light", "leaf")
BERRIES = {(0, 1): "berry", (0, 0): "berry_red", (1, 0): "berry_red", (2, 0): "berry_red", (3, 0): "berry_red", (4, 1): "berry"}
COCOONS = {(1, 1), (3, 1), (4, 0), (2, 1)}


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
    profile = [(0, -radius * 0.6), (radius * 0.8, -radius * 0.4), (radius, 0.0), (radius * 0.75, radius * 0.5), (0, radius * 0.7)]
    return lpm.lathe(name, profile, segments=6, at=at, color=PALETTE[color])


def berry_bunch(name, anchor, yaw, color):
    x, y, z = anchor
    stem_length = 0.05
    parts = [lpm.prism(f"{name}_stem", 3, 0.006, stem_length, at=(x, y, z - stem_length), color=PALETTE["stem"])]
    a = math.radians(yaw + 90)
    for i, (side, drop) in enumerate(((-1, 0.0), (1, 0.01), (0, -0.025))):
        at = (x + side * 0.035 * math.cos(a), y + side * 0.035 * math.sin(a), z - stem_length - 0.02 + drop)
        profile = [(0, -0.036), (0.036, -0.006), (0.026, 0.03), (0, 0.036)]
        parts.append(lpm.lathe(f"{name}_{i}", profile, segments=5, at=at, color=PALETTE[color]))
    return parts


def cocoon(name, anchor):
    x, y, z = anchor
    parts = [lpm.prism(f"{name}_thread", 3, 0.004, 0.06, at=(x, y, z - 0.06), color=PALETTE["cocoon"])]
    profile = [(0, -0.05), (0.037, -0.02), (0.04, 0.017), (0, 0.05)]
    parts.append(lpm.lathe(name, profile, segments=6, at=(x, y, z - 0.09), color=PALETTE["cocoon"]))
    return parts


def make_parts():
    parts = []
    parts.append(lpm.prism("mound", 8, 0.17, 0.025, color=PALETTE["soil"], radius_top=0.12))
    parts.append(lpm.prism("flare", 8, 0.1, 0.06, at=(0, 0, 0.02), color=PALETTE["bark_dark"], radius_top=0.065))
    parts.append(lpm.prism("trunk", 8, 0.065, FORK_Z - 0.06, at=(0, 0, 0.08), color=PALETTE["bark"], radius_top=0.05))

    leader, leader_tip = branch("leader", (0, 0, FORK_Z - 0.02), 6, 200, 0.5, 0.04, 0.018)
    parts.append(leader)
    parts.append(cluster("crown", 0.16, (leader_tip[0], leader_tip[1], leader_tip[2] - 0.01), "leaf_light"))

    for i, yaw in enumerate(MAIN_YAWS):
        main, main_tip = branch(f"main{i}", (0, 0, FORK_Z), MAIN_TILT, yaw, MAIN_LENGTH, 0.034, 0.019)
        parts.append(main)
        parts.append(cluster(f"inner{i}", 0.14, (main_tip[0], main_tip[1], main_tip[2] + 0.02), CROWN_COLORS[i]))
        for j, offset in enumerate(SECONDARY_OFFSETS):
            sub_yaw = yaw + offset
            sub, sub_tip = branch(f"sub{i}_{j}", main_tip, SECONDARY_TILT, sub_yaw, SECONDARY_LENGTH, 0.019, 0.009)
            parts.append(sub)
            parts.append(cluster(f"bunch{i}_{j}", 0.12, (sub_tip[0], sub_tip[1], sub_tip[2] + 0.01), BUNCH_COLORS[(i + j) % len(BUNCH_COLORS)]))
            anchor = (sub_tip[0] + 0.06 * math.cos(math.radians(sub_yaw)), sub_tip[1] + 0.06 * math.sin(math.radians(sub_yaw)), sub_tip[2] - 0.03)
            if (i, j) in BERRIES:
                parts += berry_bunch(f"berries{i}_{j}", anchor, sub_yaw, BERRIES[(i, j)])
            elif (i, j) in COCOONS:
                parts += cocoon(f"cocoon{i}_{j}", anchor)
    return parts


out_dir = os.path.dirname(os.path.abspath(__file__))
lpm.reset()
tree = lpm.finish(MODEL_ID, make_parts(), PALETTE, budget=BUDGET, center=False)
lpm.export_glb(tree, os.path.join(out_dir, MODEL_ID))
