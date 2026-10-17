"""Low-poly marina captaincy with a front pier, flag, and facade anchor."""

import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm


argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = argv[argv.index("--out") + 1]

lpm.reset()
palette = lpm.Palette([
    ("ivory", "#e8dcc1", 0.0, 0.88),
    ("ivory_shadow", "#c9baa0", 0.0, 0.9),
    ("navy", "#244963", 0.0, 0.72),
    ("roof", "#428ca0", 0.0, 0.78),
    ("roof_shadow", "#286d83", 0.0, 0.8),
    ("glass", "#75b6bf", 0.0, 0.25),
    ("wood", "#aa784d", 0.0, 0.84),
    ("wood_light", "#c79762", 0.0, 0.84),
    ("wood_dark", "#765637", 0.0, 0.86),
    ("brass", "#e4b955", 0.65, 0.38),
    ("flag_white", "#f7f0d9", 0.0, 0.82),
    ("flag_red", "#cb675a", 0.0, 0.82),
])
parts = []


def add(part):
    parts.append(part)


def box(name, size, at, color):
    add(lpm.box(name, size, at=at, color=palette[color]))


def front_plate(name, outline, at, color, thickness=0.06):
    add(lpm.sweep(name, outline, depth=thickness, at=at, color=palette[color], axis="y"))


def front_window(name, x, z, width=1.1, height=1.15):
    y = -1.24
    box(f"{name}_trim", (width + 0.17, 0.12, height + 0.17), (x, y, z - 0.08), "navy")
    box(f"{name}_glass", (width, 0.05, height), (x, y - 0.09, z), "glass")
    box(f"{name}_crossbar", (width + 0.04, 0.07, 0.08), (x, y - 0.13, z + 0.54), "ivory")
    box(f"{name}_mullion", (0.07, 0.07, height), (x, y - 0.13, z), "ivory")
    box(f"{name}_sill", (width + 0.3, 0.23, 0.11), (x, y - 0.15, z - 0.15), "ivory_shadow")


# The captaincy itself is exactly 8 m wide by 4 m deep, excluding roof overhang.
building_width = 8.0
building_depth = 4.0
building_center_y = 0.8
front_y = building_center_y - building_depth / 2
box("foundation", (8.24, 4.24, 0.35), (0, building_center_y, 0), "ivory_shadow")
box("captaincy_wall", (building_width, building_depth, 3.0), (0, building_center_y, 0.35), "ivory")
box("lower_blue_band", (8.08, 4.08, 0.31), (0, building_center_y, 0.35), "navy")
box("upper_blue_band", (8.13, 4.13, 0.16), (0, building_center_y, 3.18), "navy")

# A shallow gable keeps the building visibly one storey high.
roof_base = 3.35
front_plate("gable_wall", [(-4.0, -0.02), (4.0, -0.02), (0, 1.22)],
            (0, building_center_y, roof_base), "ivory", thickness=building_depth)
front_plate("gable_roof", [(-4.34, -0.10), (0, 1.18), (4.34, -0.10),
                           (4.34, 0.10), (0, 1.40), (-4.34, 0.10)],
            (0, building_center_y, roof_base), "roof", thickness=4.45)
box("roof_ridge", (0.16, 4.52, 0.12), (0, building_center_y, roof_base + 1.35), "roof_shadow")
box("front_eave", (8.7, 0.22, 0.18), (0, front_y - 0.13, roof_base - 0.08), "roof_shadow")
box("rear_eave", (8.7, 0.22, 0.18), (0, building_center_y + 2.13, roof_base - 0.08), "roof_shadow")

# Front door and paired harbour-facing windows.
box("door_frame", (1.31, 0.15, 2.25), (-0.65, front_y - 0.06, 0.65), "navy")
box("door", (1.13, 0.07, 2.14), (-0.65, front_y - 0.16, 0.65), "wood_dark")
box("door_glass", (0.76, 0.05, 0.83), (-0.65, front_y - 0.21, 1.75), "glass")
add(lpm.prism("door_handle", 8, 0.055, 0.07, at=(-0.18, front_y - 0.25, 1.59),
              color=palette["brass"]))
front_window("left_window", -2.65, 1.57)
front_window("right_window", 1.3, 1.57)

rear_y = building_center_y + building_depth / 2
box("rear_door_frame", (1.31, 0.15, 2.25), (0, rear_y + 0.06, 0.65), "navy")
box("rear_door", (1.13, 0.07, 2.14), (0, rear_y + 0.16, 0.65), "wood_dark")
box("rear_door_glass", (0.76, 0.05, 0.83), (0, rear_y + 0.21, 1.75), "glass")
box("rear_door_handle", (0.08, 0.07, 0.08), (0.44, rear_y + 0.26, 1.59), "brass")

# Side windows make the shallow side elevation legible.
for side in (-1, 1):
    x = side * 4.04
    for index, y in enumerate((0.05, 1.85)):
        box(f"side_trim_{side}_{index}", (0.12, 1.04, 1.12), (x, y, 1.46), "navy")
        box(f"side_glass_{side}_{index}", (0.06, 0.88, 0.96), (x + side * 0.08, y, 1.54), "glass")
        box(f"side_sill_{side}_{index}", (0.22, 1.19, 0.11), (x + side * 0.08, y, 1.41), "ivory_shadow")

# An anchor is mounted directly on the front facade, right of the windows.
anchor_x = 2.95
anchor_y = front_y - 0.18
front_plate("anchor_backing", [(-0.67, 0), (0.67, 0), (0.67, 1.48), (-0.67, 1.48)],
            (anchor_x, anchor_y, 1.05), "navy", 0.08)
front_plate("anchor_ring", [(0.0, 0.0), (0.16, 0.07), (0.23, 0.23), (0.16, 0.39),
                             (0.0, 0.46), (-0.16, 0.39), (-0.23, 0.23), (-0.16, 0.07)],
            (anchor_x, anchor_y - 0.07, 2.03), "brass", 0.06)
front_plate("anchor_ring_cutout", [(0.0, 0.0), (0.09, 0.04), (0.13, 0.13), (0.09, 0.22),
                                    (0.0, 0.26), (-0.09, 0.22), (-0.13, 0.13), (-0.09, 0.04)],
            (anchor_x, anchor_y - 0.115, 2.13), "navy", 0.03)
box("anchor_shank", (0.105, 0.08, 0.85), (anchor_x, anchor_y - 0.09, 1.36), "brass")
box("anchor_stock", (0.68, 0.08, 0.10), (anchor_x, anchor_y - 0.10, 1.89), "brass")
front_plate("anchor_crown", [(-0.45, 0.43), (-0.34, 0.17), (-0.12, 0.02),
                              (0.12, 0.02), (0.34, 0.17), (0.45, 0.43),
                              (0.35, 0.33), (0.26, 0.20), (0.10, 0.12),
                              (-0.10, 0.12), (-0.26, 0.20), (-0.35, 0.33)],
            (anchor_x, anchor_y - 0.105, 1.22), "brass", 0.07)

# A timber pier extends out from the entrance toward the water.
pier_width = 5.8
pier_front = -5.45
pier_back = front_y - 0.04
pier_depth = pier_back - pier_front
for index in range(11):
    y = pier_front + (index + 0.5) * pier_depth / 11
    box(f"pier_plank_{index:02d}", (pier_width, pier_depth / 11 - 0.035, 0.17),
        (0, y, 0.56), "wood_light" if index % 2 == 0 else "wood")
for x in (-2.58, 2.58):
    box(f"pier_stringer_{x}", (0.18, pier_depth, 0.18), (x, (pier_front + pier_back) / 2, 0.39), "wood_dark")
    for index, y in enumerate((-5.05, -3.05, -1.55)):
        box(f"pier_post_{x}_{index}", (0.25, 0.25, 0.80), (x, y, 0), "wood_dark")
for x in (-2.2, 2.2):
    box(f"mooring_bollard_{x}", (0.21, 0.21, 0.38), (x, -4.85, 0.73), "navy")
    box(f"mooring_cap_{x}", (0.48, 0.23, 0.10), (x, -4.85, 1.06), "navy")

# Flagpole and a wind-blown three-colour pennant at the pier entrance.
flag_x, flag_y = -3.38, -1.9
add(lpm.prism("flagpole", 8, 0.075, 5.35, at=(flag_x, flag_y, 0.0), color=palette["ivory_shadow"]))
add(lpm.prism("pole_finial", 8, 0.15, 0.20, at=(flag_x, flag_y, 5.35),
              color=palette["brass"], radius_top=0.04))
flag_outline = [(0.0, 0.0), (0.82, 0.08), (1.55, -0.06), (1.31, -0.55),
                (0.65, -0.48), (0.0, -0.55)]
front_plate("flag_cloth", flag_outline, (flag_x, flag_y, 4.68), "flag_white", 0.06)
front_plate("flag_blue", [(0.0, 0.0), (0.51, 0.05), (0.51, -0.49), (0.0, -0.55)],
            (flag_x, flag_y - 0.04, 4.68), "navy", 0.025)
front_plate("flag_red", [(1.02, -0.01), (1.55, -0.06), (1.31, -0.55), (1.02, -0.52)],
            (flag_x, flag_y - 0.04, 4.68), "flag_red", 0.025)

marina = lpm.finish("MarinaCaptaincy", parts, palette, budget=3000)
lpm.export_glb(marina, out)
