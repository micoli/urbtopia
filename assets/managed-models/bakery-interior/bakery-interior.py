import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("white", "#f6f2ea", 0.0, 0.9), ("glass", "#cfeefa", 0.0, 0.2), ("belt", "#33363f", 0.0, 0.9),
    ("cream", "#f1e2c4", 0.0, 0.9), ("cream_dark", "#d9c49b", 0.0, 0.9), ("terracotta", "#c8643b", 0.0, 0.85), ("terracotta_dark", "#9c4a2a", 0.0, 0.85),
    ("brick", "#a8553a", 0.0, 0.9), ("flame", "#ff9a2e", 0.0, 0.4, 1.2), ("dough", "#f3e7cf", 0.0, 0.9),
    ("bread", "#d79a4e", 0.0, 0.85), ("bread_dark", "#a8692c", 0.0, 0.85), ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9),
    ("tile", "#e8e1d0", 0.0, 0.9), ("tile_dark", "#cfc6b0", 0.0, 0.9),
])

BELT_Z = 0.42
DRIVE_Z = 0.34


def sideways(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +x, then move it."""
    lpm.rotate(ob, 90, axis="Y")
    lpm.move(ob, x, y, z)
    return ob


def horizontal(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +y, then move it."""
    lpm.rotate(ob, -90, axis="X")
    lpm.move(ob, x, y, z)
    return ob


def shifted(parts, dy):
    """Move parts along y: a part drawn against a wall at y 0 is moved so that its back lies on the back edge of its tile (y 0.5)."""
    for part in parts:
        lpm.move(part, 0, dy, 0)
    return parts


def belt(y0, y1):
    return [block("belt_rail_l", -0.2, -0.17, y0, y1, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, y0, y1, 0.3, BELT_Z, P["steel"]),
            block("belt_bed", -0.17, 0.17, y0, y1, 0.3, BELT_Z - 0.02, P["belt"])]


def mixer(rng):
    """Dough mixer standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a cream cabinet with a
    steel bowl on top where a spiral hook kneads, a flour hopper behind the bowl and a mouth that pushes a tray of dough onto the belt at BELT_Z, which ends on the front edge of
    the tile where the first Conveyor begins. The shaft stub that brings the Drive in sticks out of the right side on the axis of the Shafts."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.8, P["cream"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["terracotta"]),
             block("body_top", -0.41, 0.41, front - 0.01, 0.0, 0.78, 0.82, P["terracotta_dark"]),
             disc("bowl", 0.24, 0.16, (0.0, -0.28, 0.82), P["steel"], 14), disc("bowl_rim", 0.26, 0.03, (0.0, -0.28, 0.95), P["steel_dark"], 14),
             disc("dough_ball", 0.2, 0.05, (0.0, -0.28, 0.93), P["dough"], 12),
             block("arm", -0.04, 0.04, -0.12, 0.0, 0.82, 1.1, P["cream_dark"]), block("head", -0.1, 0.1, -0.4, -0.04, 1.06, 1.14, P["cream"]),
             block("head_cap", -0.11, 0.11, -0.41, -0.03, 1.12, 1.16, P["terracotta_dark"]),
             block("hopper_base", -0.2, 0.2, -0.1, 0.0, 0.82, 0.9, P["steel_dark"]), block("hopper_lip", -0.24, 0.24, -0.12, 0.0, 0.9, 0.94, P["steel"]),
             block("hopper_in", -0.2, 0.2, -0.1, -0.02, 0.93, 0.94, P["white"]),
             block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.6, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.6, 0.64, P["steel_dark"]),
             block("mouth_frame_l", -0.22, -0.2, front - 0.02, front, 0.36, 0.6, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, front - 0.02, front, 0.36, 0.6, P["steel_dark"]),
             block("panel", 0.0, 0.34, front - 0.015, front, 0.66, 0.76, P["iron"]), block("screen", 0.03, 0.2, front - 0.02, front - 0.015, 0.68, 0.74, P["glass"]),
             block("button_red", 0.24, 0.28, front - 0.02, front - 0.015, 0.68, 0.74, P["red"]), block("button_green", 0.29, 0.33, front - 0.02, front - 0.015, 0.68, 0.74, P["green"]),
             block("tray", -0.16, 0.16, front - 0.12, front, BELT_Z, BELT_Z + 0.02, P["steel"]),
             block("loaf", -0.1, 0.1, front - 0.1, front - 0.02, BELT_Z + 0.02, BELT_Z + 0.07, P["dough"])]
    parts += belt(-1.0, front) + [block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    parts += [block("gearbox", 0.4, 0.46, -0.58, -0.42, 0.26, 0.42, P["iron"]), sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=-0.5, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=-0.5, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=-0.5, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.59, -0.41, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    hook = [disc("hook_rod", 0.025, 0.2, (0.0, -0.28, 0.95), P["steel"], 6), block("hook_a", -0.14, 0.14, -0.3, -0.26, 0.97, 1.0, P["steel"]), block("hook_b", -0.02, 0.02, -0.42, -0.14, 0.97, 1.0, P["steel"])]
    return shifted(parts, 0.5), {"spin-x": (shifted(pulley, 0.5), (0.46, 0.0, DRIVE_Z)), "spin-up": (shifted(hook, 0.5), (0.0, 0.22, 0.97))}


def oven(rng):
    """Tunnel oven that a Line passes through, along y: the belt runs through a brick tunnel with a glowing mouth at each end, a chimney on the roof and a gas inlet at the left,
    the Flow that heats it. The loaves come in at +y and leave toward -y. A fan turns on the roof."""
    parts = belt(-0.5, 0.5)
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("wall_l", -0.34, -0.2, -0.3, 0.3, 0.3, 0.84, P["brick"]), block("wall_r", 0.2, 0.34, -0.3, 0.3, 0.3, 0.84, P["brick"]),
              block("roof", -0.36, 0.36, -0.32, 0.32, 0.84, 0.98, P["brick"]), block("roof_cap", -0.38, 0.38, -0.34, 0.34, 0.96, 1.0, P["terracotta_dark"]),
              block("base", -0.36, 0.36, -0.32, 0.32, 0.26, 0.32, P["terracotta_dark"]),
              block("glow_front", -0.17, 0.17, -0.31, -0.3, 0.46, 0.7, P["flame"]), block("glow_back", -0.17, 0.17, 0.3, 0.31, 0.46, 0.7, P["flame"]),
              block("arch_front", -0.2, 0.2, -0.32, -0.3, 0.7, 0.8, P["black"]), block("arch_back", -0.2, 0.2, 0.3, 0.32, 0.7, 0.8, P["black"]),
              block("loaf_a", -0.09, 0.09, -0.12, -0.02, BELT_Z, BELT_Z + 0.07, P["bread"]), block("loaf_b", -0.09, 0.09, 0.1, 0.2, BELT_Z, BELT_Z + 0.07, P["bread_dark"]),
              disc("chimney", 0.07, 0.3, (0.18, 0.0, 1.0), P["terracotta"], 8), disc("chimney_cap", 0.095, 0.03, (0.18, 0.0, 1.3), P["black"], 8),
              block("panel", -0.38, -0.34, -0.12, 0.12, 0.6, 0.78, P["iron"]), block("screen", -0.384, -0.38, -0.08, 0.08, 0.66, 0.74, P["flame"]),
              block("gas_box", -0.46, -0.34, -0.08, 0.08, 0.26, 0.42, P["iron"]), sideways(disc("gas_inlet", 0.045, 0.14, (0, 0, 0), P["steel"], 8), x=-0.5, y=0.0, z=0.34),
              sideways(disc("gas_flange", 0.07, 0.03, (0, 0, 0), P["terracotta_dark"], 8), x=-0.5, y=0.0, z=0.34)]
    fan = [block("fan_a", -0.12, 0.12, -0.02, 0.02, 1.02, 1.05, P["steel"]), block("fan_b", -0.02, 0.02, -0.12, 0.12, 1.02, 1.05, P["steel"]), disc("fan_hub", 0.035, 0.05, (0, 0, 1.0), P["steel_dark"], 6)]
    parts += [disc("fan_stem", 0.02, 0.04, (-0.15, 0.0, 1.0), P["iron"], 6)]
    for part in fan:
        lpm.move(part, -0.15, 0.0, 0.0)
    return parts, {"spin-up": (fan, (-0.15, 0.0, 1.03))}


def counter_exit(rng):
    """Exit standing against a wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): the belt comes in from the room at
    BELT_Z, goes through a hatch of the wall and ends in a glass display case on the shop side, where the seller serves the loaves. The loaves travel toward +y."""
    parts = belt(-1.0, 0.1)
    for k, y in enumerate((-0.92, -0.5, -0.14)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("hatch_l", -0.3, -0.22, -0.06, 0.04, 0.3, 0.72, P["terracotta_dark"]), block("hatch_r", 0.22, 0.3, -0.06, 0.04, 0.3, 0.72, P["terracotta_dark"]),
              block("hatch_top", -0.3, 0.3, -0.06, 0.04, 0.6, 0.72, P["terracotta_dark"]), block("hatch_cap", -0.32, 0.32, -0.07, 0.05, 0.7, 0.74, P["terracotta"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.74, 0.78, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.78, 0.84, P["green"])]
    parts += [block(f"curtain{k}", -0.22 + 0.088 * k, -0.22 + 0.088 * k + 0.08, -0.03, -0.01, 0.46, 0.6, P["belt"]) for k in range(5)]
    parts += [block("case_base", -0.36, 0.36, 0.04, 0.5, 0.0, 0.36, P["wood"]), block("case_front", -0.37, 0.37, 0.48, 0.52, 0.0, 0.38, P["wood_dark"]),
              block("case_top", -0.37, 0.37, 0.04, 0.52, 0.36, 0.4, P["terracotta"]),
              block("case_post_l", -0.36, -0.32, 0.46, 0.5, 0.4, 0.74, P["wood_dark"]), block("case_post_r", 0.32, 0.36, 0.46, 0.5, 0.4, 0.74, P["wood_dark"]),
              block("case_glass", -0.32, 0.32, 0.47, 0.49, 0.4, 0.7, P["glass"]), block("case_roof", -0.37, 0.37, 0.04, 0.52, 0.72, 0.76, P["terracotta"]),
              block("shelf_loaf_a", -0.28, -0.1, 0.18, 0.36, 0.4, 0.46, P["bread"]), block("shelf_loaf_b", -0.06, 0.12, 0.18, 0.36, 0.4, 0.46, P["bread_dark"]),
              block("shelf_loaf_c", 0.14, 0.3, 0.18, 0.36, 0.4, 0.45, P["bread"])]
    return shifted(parts, 0.5), {}


def tile_floor(rng):
    """Cream tile floor centred on the origin, like the walls."""
    return checker_floor(P, "tile", "tile_dark", cells=2)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def cream_wall(rng):
    return half_height(thick_wall(P, "cream", "terracotta", "terracotta_dark", "wood"))


def cream_partition(rng):
    return half_height(partition_wall(P, "cream", "terracotta", "terracotta_dark", "wood"))


def cream_junction(arms):
    return lambda rng: half_height(junction_wall(P, "cream", "terracotta", "terracotta_dark", "wood", arms))


def cream_corner(rng):
    return half_height(thick_corner(P, "cream", "terracotta", "terracotta_dark", "wood"))


def wall_set():
    return {"floor": tile_floor, "wall": cream_wall, "partition": cream_partition, "partition-elbow": cream_junction("ES"), "partition-tee": cream_junction("WES"),
            "partition-cross": cream_junction("ESWN"), "wall-corner": cream_corner}


if __name__ == "__main__":
    models = {"mixer": mixer, "oven": oven, "counter-exit": counter_exit}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
