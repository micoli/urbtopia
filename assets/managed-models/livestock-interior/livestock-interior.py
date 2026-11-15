import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import THICK, block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7), ("blue", "#2f7de1", 0.0, 0.5),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9),
    ("straw", "#e3c26b", 0.0, 0.95), ("straw_dark", "#c9a24d", 0.0, 0.95), ("straw_light", "#f0d98f", 0.0, 0.95),
    ("wheat", "#e8c96a", 0.0, 0.8), ("belt", "#33363f", 0.0, 0.9),
    ("milk", "#f4f1ea", 0.2, 0.5), ("egg", "#f6ecd8", 0.0, 0.8), ("wool", "#efe6d2", 0.0, 0.95), ("silk", "#e7a9c4", 0.0, 0.6), ("rope", "#a8845a", 0.0, 0.9),
    ("barn_red", "#a63d2f", 0.0, 0.9), ("barn_red_dark", "#7d2c22", 0.0, 0.9),
])


BELT_Z = 0.42
DRIVE_Z = 0.34


def sideways(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +x, then move it."""
    lpm.rotate(ob, 90, axis="Y")
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


def pen(rng):
    """Animal pen on one tile, open at the front (-y): a bed of straw inside a low fence of two rails on the back and on the sides, and a gate between two taller posts on the
    front, so that the animal that stands in the middle stays in view. The rails are wood on dark posts."""
    parts = [block("litter", -0.46, 0.46, -0.46, 0.46, 0.0, 0.05, P["straw"]),
             block("patch_a", -0.3, -0.1, 0.1, 0.34, 0.05, 0.065, P["straw_dark"]), block("patch_b", 0.08, 0.34, -0.3, -0.06, 0.05, 0.065, P["straw_light"]),
             block("patch_c", -0.34, -0.12, -0.34, -0.2, 0.05, 0.062, P["straw_light"])]
    for k, (x, y) in enumerate(((-0.46, 0.46), (0.0, 0.46), (0.46, 0.46), (-0.46, 0.0), (0.46, 0.0), (-0.46, -0.46), (0.46, -0.46))):
        parts.append(block(f"post{k}", x - 0.035, x + 0.035, y - 0.035, y + 0.035, 0.0, 0.36, P["wood_dark"]))
    for k, z in enumerate((0.12, 0.26)):
        parts += [block(f"rail_back{k}", -0.46, 0.46, 0.45, 0.47, z, z + 0.04, P["wood"]),
                  block(f"rail_left{k}", -0.47, -0.45, -0.46, 0.46, z, z + 0.04, P["wood"]), block(f"rail_right{k}", 0.45, 0.47, -0.46, 0.46, z, z + 0.04, P["wood"])]
    parts += [block("gate_post_l", -0.2, -0.14, -0.49, -0.43, 0.0, 0.42, P["wood_dark"]), block("gate_post_r", 0.14, 0.2, -0.49, -0.43, 0.0, 0.42, P["wood_dark"]),
              block("gate_cap_l", -0.21, -0.13, -0.5, -0.42, 0.42, 0.45, P["brass"]), block("gate_cap_r", 0.13, 0.21, -0.5, -0.42, 0.42, 0.45, P["brass"]),
              block("front_rail_l0", -0.46, -0.2, -0.47, -0.45, 0.12, 0.16, P["wood"]), block("front_rail_l1", -0.46, -0.2, -0.47, -0.45, 0.26, 0.3, P["wood"]),
              block("front_rail_r0", 0.2, 0.46, -0.47, -0.45, 0.12, 0.16, P["wood"]), block("front_rail_r1", 0.2, 0.46, -0.47, -0.45, 0.26, 0.3, P["wood"]),
              block("gate_open", -0.2, -0.14, -0.45, -0.1, 0.14, 0.18, P["wood_light"]), block("gate_open_b", -0.2, -0.14, -0.45, -0.1, 0.28, 0.32, P["wood_light"]),
              block("gate_hinge", -0.2, -0.14, -0.1, -0.06, 0.14, 0.32, P["wood_light"]),
              block("sign_post", -0.01, 0.01, -0.49, -0.47, 0.0, 0.3, P["wood_dark"]), block("sign", -0.08, 0.08, -0.5, -0.48, 0.3, 0.4, P["yellow"])]
    return parts


def feeder(rng):
    """Feeder at the end of a Line, facing -y: a stub of belt comes in from the room at the front and ends at the rim of a long hollow wooden trough, where it tips the feed, and the animals feed from the back (+y), where the trough has only a low lip, under a hay rack of slats raised on two posts."""
    parts = [block("belt_rail_l", -0.2, -0.17, -0.5, -0.06, 0.3, 0.42, P["steel"]), block("belt_rail_r", 0.17, 0.2, -0.5, -0.06, 0.3, 0.42, P["steel"]),
             block("belt_bed", -0.17, 0.17, -0.5, -0.06, 0.3, 0.4, P["belt"])]
    for k, y in enumerate((-0.46, -0.2)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("belt_end", -0.2, 0.2, -0.06, -0.02, 0.3, 0.42, P["steel_dark"]), block("spill", -0.14, 0.14, -0.02, 0.1, 0.3, 0.33, P["wheat"]),
              block("trough_base", -0.44, 0.44, -0.02, 0.36, 0.0, 0.06, P["wood_dark"]),
              block("trough_front", -0.44, 0.44, -0.02, 0.03, 0.06, 0.3, P["wood"]), block("trough_back", -0.44, 0.44, 0.31, 0.36, 0.06, 0.14, P["wood"]),
              block("trough_end_l", -0.44, -0.39, 0.03, 0.31, 0.06, 0.3, P["wood"]), block("trough_end_r", 0.39, 0.44, 0.03, 0.31, 0.06, 0.3, P["wood"]),
              block("trough_inner_floor", -0.39, 0.39, 0.03, 0.31, 0.06, 0.09, P["wood_dark"]),
              block("feed", -0.36, 0.36, 0.06, 0.28, 0.09, 0.14, P["wheat"]),
              block("rim_front", -0.46, 0.46, -0.04, 0.04, 0.3, 0.33, P["wood_dark"]), block("rim_back", -0.46, 0.46, 0.3, 0.38, 0.14, 0.17, P["wood_dark"]),
              block("rim_end_l", -0.46, -0.38, 0.04, 0.3, 0.3, 0.33, P["wood_dark"]), block("rim_end_r", 0.38, 0.46, 0.04, 0.3, 0.3, 0.33, P["wood_dark"])]
    for k, x in enumerate((-0.4, 0.4)):
        parts.append(block(f"rack_post{k}", x - 0.03, x + 0.03, 0.4, 0.46, 0.0, 0.9, P["wood_dark"]))
    for k, x in enumerate((-0.3, -0.15, 0.0, 0.15, 0.3)):
        parts.append(block(f"slat{k}", x - 0.015, x + 0.015, 0.41, 0.45, 0.5, 0.86, P["wood"]))
    parts += [block("rack_rail_low", -0.42, 0.42, 0.39, 0.47, 0.46, 0.5, P["wood_dark"]), block("rack_rail_high", -0.42, 0.42, 0.39, 0.47, 0.86, 0.9, P["wood_dark"]),
              block("hay", -0.36, 0.36, 0.38, 0.48, 0.9, 1.02, P["straw"]), block("hay_top", -0.3, 0.3, 0.4, 0.46, 1.02, 1.08, P["straw_light"])]
    return parts


def feed_intake(rng):
    """Feed intake standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a wooden cabinet with a red
    band and a steel hopper of grain on top, filled by a pipe that comes down from the grain silo behind it, and a mouth that lets the feed fall on the belt at BELT_Z, which ends on
    the front edge of the tile where the first Conveyor begins. A paddle turns in the hopper. The shaft stub that brings the Drive in sticks out of the right side on the axis of the Shafts."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.7, P["wood"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["barn_red"]),
             block("body_top", -0.41, 0.41, front - 0.01, 0.0, 0.68, 0.72, P["barn_red_dark"]),
             lpm.prism("hopper", 8, 0.1, 0.3, at=(0.0, -0.3, 0.72), color=P["steel"], radius_top=0.3, rotate=22.5), disc("hopper_rim", 0.32, 0.03, (0.0, -0.3, 1.0), P["steel_dark"], 8),
             disc("grain", 0.28, 0.02, (0.0, -0.3, 0.99), P["wheat"], 8),
             block("silo_pipe", -0.05, 0.05, -0.1, 0.0, 0.72, 1.3, P["steel"]), block("silo_flange_a", -0.07, 0.07, -0.12, 0.02, 0.84, 0.88, P["brass"]), block("silo_flange_b", -0.07, 0.07, -0.12, 0.02, 1.1, 1.14, P["brass"]),
             block("silo_elbow", -0.05, 0.05, -0.3, 0.0, 1.22, 1.3, P["steel"]), block("silo_spout", -0.05, 0.05, -0.35, -0.25, 1.0, 1.3, P["steel"]),
             block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.6, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.6, 0.64, P["steel_dark"]),
             block("mouth_frame_l", -0.22, -0.2, front - 0.02, front, 0.36, 0.6, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, front - 0.02, front, 0.36, 0.6, P["steel_dark"]),
             block("panel", 0.0, 0.34, front - 0.015, front, 0.62, 0.68, P["iron"]), block("screen", 0.03, 0.2, front - 0.02, front - 0.015, 0.63, 0.67, P["blue"]),
             block("button_red", 0.24, 0.28, front - 0.02, front - 0.015, 0.63, 0.67, P["red"]), block("button_green", 0.29, 0.33, front - 0.02, front - 0.015, 0.63, 0.67, P["green"]),
             block("tray", -0.16, 0.16, front - 0.12, front, BELT_Z, BELT_Z + 0.02, P["steel"]),
             block("feed_pile", -0.1, 0.1, front - 0.1, front - 0.02, BELT_Z + 0.02, BELT_Z + 0.07, P["wheat"])]
    parts += belt(-1.0, front) + [block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    parts += [block("gearbox", 0.4, 0.46, -0.58, -0.42, 0.26, 0.42, P["iron"]), sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=-0.5, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=-0.5, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=-0.5, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.59, -0.41, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    paddle = [block("paddle_a", -0.26, 0.26, -0.32, -0.28, 1.0, 1.03, P["iron"]), block("paddle_b", -0.02, 0.02, -0.56, -0.04, 1.0, 1.03, P["iron"]), disc("paddle_hub", 0.035, 0.06, (0.0, -0.3, 0.99), P["steel_dark"], 6)]
    return shifted(parts, 0.5), {"spin-x": (shifted(pulley, 0.5), (0.46, 0.0, DRIVE_Z)), "spin-up": (shifted(paddle, 0.5), (0.0, 0.2, 1.015))}


def collection_exit(rng):
    """Exit that is a piece of wall, centred on its tile like a partition and in line with the partitions beside it: its ears are the same half-height barn wall, wooden planks with a
    red band, dark plinths and cap, running to both sides of the tile. A short stub of belt comes in from the room (-y) at BELT_Z, goes through a hatch left in the wall, under a lintel
    that stands above the goods, and drops them on the loading bay on the lorry side (+y): a crate of eggs, two milk churns, a bale of wool and a skein of silk on a wooden platform.
    The goods travel toward +y."""
    h = THICK / 2
    top = 0.5
    parts = belt(-0.5, -0.08)
    for k, y in enumerate((-0.44, -0.24)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    for k, (x0, x1) in enumerate(((-0.5, -0.25), (0.25, 0.5))):
        parts += [block(f"ear{k}", x0, x1, -h, h, 0.0, top, P["wood"]), block(f"ear_cap{k}", x0, x1, -h, h, top - 0.015, top, P["wood_dark"]),
                  block(f"ear_plinth_a{k}", x0, x1, h, h + 0.03, 0.0, 0.06, P["wood_dark"]), block(f"ear_plinth_b{k}", x0, x1, -h - 0.03, -h, 0.0, 0.06, P["wood_dark"]),
                  block(f"ear_band_a{k}", x0, x1, h, h + 0.015, 0.3, 0.47, P["barn_red"]), block(f"ear_band_b{k}", x0, x1, -h - 0.015, -h, 0.3, 0.47, P["barn_red"])]
    parts += [block("post_l", -0.28, -0.22, -h - 0.02, h + 0.02, 0.0, 0.58, P["barn_red_dark"]), block("post_r", 0.22, 0.28, -h - 0.02, h + 0.02, 0.0, 0.58, P["barn_red_dark"]),
              block("lintel", -0.3, 0.3, -h - 0.03, h + 0.03, 0.54, 0.6, P["barn_red"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.6, 0.64, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.64, 0.7, P["green"]),
              block("drop_plate", -0.17, 0.17, -0.08, 0.2, 0.34, 0.37, P["steel"]), block("drop_lip", -0.17, 0.17, 0.18, 0.22, 0.3, 0.37, P["steel_dark"])]
    parts += [block("bay", -0.42, 0.42, h + 0.01, 0.5, 0.0, 0.1, P["wood_dark"]), block("bay_plank_a", -0.42, 0.42, 0.2, 0.24, 0.1, 0.11, P["wood"]),
              block("bay_plank_b", -0.42, 0.42, 0.34, 0.38, 0.1, 0.11, P["wood"])]
    parts += [block("crate", -0.38, -0.1, 0.26, 0.46, 0.11, 0.25, P["wood_light"]), block("crate_rim", -0.39, -0.09, 0.25, 0.47, 0.22, 0.25, P["wood"])]
    for k, (x, y) in enumerate(((-0.3, 0.32), (-0.2, 0.32), (-0.3, 0.41), (-0.2, 0.41))):
        parts.append(disc(f"egg{k}", 0.035, 0.05, (x, y, 0.25), P["egg"], 6))
    for k, x in enumerate((0.0, 0.14)):
        parts += [disc(f"churn{k}", 0.065, 0.22, (x, 0.34, 0.11), P["milk"], 8), disc(f"churn_neck{k}", 0.045, 0.05, (x, 0.34, 0.33), P["milk"], 8),
                  disc(f"churn_lid{k}", 0.055, 0.02, (x, 0.34, 0.38), P["steel_dark"], 8), disc(f"churn_band{k}", 0.068, 0.02, (x, 0.34, 0.2), P["steel"], 8)]
    parts += [block("bale", 0.24, 0.4, 0.26, 0.46, 0.11, 0.26, P["wool"]), block("bale_rope_a", 0.23, 0.41, 0.3, 0.32, 0.11, 0.27, P["rope"]), block("bale_rope_b", 0.23, 0.41, 0.4, 0.42, 0.11, 0.27, P["rope"]),
              block("skein", 0.22, 0.38, 0.14, 0.24, 0.11, 0.17, P["silk"]), block("skein_tie", 0.28, 0.32, 0.14, 0.24, 0.17, 0.19, P["rope"])]
    return parts, {}


def mirrored(builder):
    """The model a builder draws, turned into its mirror image across the x = 0 plane, with the pivots of its moving parts."""
    def build(rng):
        parts = builder(rng)
        if not isinstance(parts, tuple):
            return [lpm.scale(part, sx=-1) for part in parts]
        shapes, spinners = parts
        flipped = {name: ([lpm.scale(part, sx=-1) for part in group], (-pivot[0], pivot[1], pivot[2])) for name, (group, pivot) in spinners.items()}
        return [lpm.scale(part, sx=-1) for part in shapes], flipped
    return build


def straw_floor(rng):
    """Straw floor tile centred on the origin, like the walls."""
    return checker_floor(P, "straw", "straw_dark", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the animals stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    """The coloured band keeps its place on the wall (from 0.3), cut under the cap of the lower wall."""
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def plank_wall(rng):
    return half_height(thick_wall(P, "wood", "barn_red", "wood_dark", "wood_dark"))


def plank_partition(rng):
    return half_height(partition_wall(P, "wood", "barn_red", "wood_dark", "wood_dark"))


def plank_junction(arms):
    return lambda rng: half_height(junction_wall(P, "wood", "barn_red", "wood_dark", "wood_dark", arms))


def plank_corner(rng):
    return half_height(thick_corner(P, "wood", "barn_red", "wood_dark", "wood_dark"))


def wall_set():
    return {"floor": straw_floor, "wall": plank_wall, "partition": plank_partition, "partition-elbow": plank_junction("ES"), "partition-tee": plank_junction("WES"),
            "partition-cross": plank_junction("ESWN"), "wall-corner": plank_corner}


if __name__ == "__main__":
    models = {"pen": pen, "feeder": feeder, "feed-intake": feed_intake, "feed-intake-left": mirrored(feed_intake), "collection-exit": collection_exit}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
