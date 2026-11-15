import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import THICK, block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("white", "#f6f2ea", 0.0, 0.9), ("glass", "#cfeefa", 0.0, 0.2), ("belt", "#33363f", 0.0, 0.9),
    ("cream", "#f3ead8", 0.0, 0.9), ("cream_dark", "#d8ccb0", 0.0, 0.9), ("blue", "#2f7de1", 0.0, 0.5), ("navy", "#2d4a8a", 0.0, 0.6),
    ("yarn_red", "#d8483f", 0.0, 0.95), ("yarn_blue", "#3d7fd1", 0.0, 0.95), ("yarn_yellow", "#f2c438", 0.0, 0.95), ("yarn_green", "#58b04a", 0.0, 0.95),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9),
    ("tile", "#f1ece0", 0.0, 0.9), ("tile_dark", "#c9d6e8", 0.0, 0.9),
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


def cone(name, x, y, z, color, height=0.2):
    """A cone of yarn on a pin, wide at the foot."""
    return [disc(f"{name}_pin", 0.012, height + 0.04, (x, y, z), P["steel_dark"], 6),
            lpm.prism(f"{name}_yarn", 8, 0.06, height, at=(x, y, z), color=P[color], radius_top=0.035)]


def knitter(rng):
    """Circular knitter standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a cream cabinet with a
    blue band and a needle drum on top that knits, three cones of yarn on a rack behind the drum and a mouth that pushes the knitted piece onto the belt at BELT_Z, which ends on the
    front edge of the tile where the first Conveyor begins. The shaft stub that brings the Drive in sticks out of the right side on the axis of the Shafts."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.72, P["cream"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["blue"]),
             block("body_top", -0.41, 0.41, front - 0.01, 0.0, 0.7, 0.74, P["navy"]),
             disc("drum_base", 0.25, 0.06, (0.0, -0.3, 0.74), P["steel_dark"], 14), disc("drum_top", 0.2, 0.03, (0.0, -0.3, 0.9), P["steel"], 14),
             disc("drum_shaft", 0.04, 0.1, (0.0, -0.3, 0.9), P["iron"], 6),
             block("post_l", -0.38, -0.33, -0.12, -0.04, 0.74, 1.08, P["wood_dark"]), block("post_r", 0.33, 0.38, -0.12, -0.04, 0.74, 1.08, P["wood_dark"]),
             block("shelf", -0.4, 0.4, -0.14, -0.02, 1.04, 1.08, P["wood"]),
             block("arm", -0.025, 0.025, -0.3, -0.08, 1.0, 1.04, P["steel_dark"]), block("feeder", -0.04, 0.04, -0.36, -0.26, 0.96, 1.04, P["brass"]),
             block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.6, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.6, 0.64, P["steel_dark"]),
             block("mouth_frame_l", -0.22, -0.2, front - 0.02, front, 0.36, 0.6, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, front - 0.02, front, 0.36, 0.6, P["steel_dark"]),
             block("panel", 0.0, 0.34, front - 0.015, front, 0.66, 0.7, P["iron"]), block("screen", 0.03, 0.2, front - 0.02, front - 0.015, 0.665, 0.695, P["glass"]),
             block("button_red", 0.24, 0.28, front - 0.02, front - 0.015, 0.665, 0.695, P["red"]), block("button_green", 0.29, 0.33, front - 0.02, front - 0.015, 0.665, 0.695, P["green"]),
             block("tray", -0.16, 0.16, front - 0.12, front, BELT_Z, BELT_Z + 0.02, P["steel"]),
             block("piece", -0.12, 0.12, front - 0.1, front - 0.02, BELT_Z + 0.02, BELT_Z + 0.07, P["yarn_red"]), block("piece_stripe", -0.12, 0.12, front - 0.07, front - 0.05, BELT_Z + 0.07, BELT_Z + 0.075, P["white"])]
    for k, (x, color) in enumerate(((-0.24, "yarn_red"), (0.0, "yarn_yellow"), (0.24, "yarn_blue"))):
        parts += cone(f"cone{k}", x, -0.08, 1.08, color)
    parts += belt(-1.0, front) + [block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    parts += [block("gearbox", 0.4, 0.46, -0.58, -0.42, 0.26, 0.42, P["iron"]), sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=-0.5, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=-0.5, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=-0.5, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.59, -0.41, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    needles = [disc("needle_ring", 0.22, 0.1, (0.0, -0.3, 0.8), P["steel"], 14), disc("needle_band", 0.225, 0.03, (0.0, -0.3, 0.84), P["navy"], 14)]
    for k, (x, y) in enumerate(((0.2, 0.0), (-0.2, 0.0), (0.0, 0.2), (0.0, -0.2), (0.14, 0.14), (-0.14, -0.14))):
        needles.append(block(f"needle{k}", x - 0.02, x + 0.02, -0.3 + y - 0.02, -0.3 + y + 0.02, 0.9, 0.96, P["brass"]))
    return shifted(parts, 0.5), {"spin-x": (shifted(pulley, 0.5), (0.46, 0.0, DRIVE_Z)), "spin-up": (shifted(needles, 0.5), (0.0, 0.2, 0.85))}


def finisher(rng):
    """Steam finisher that a Line passes through, along y: the belt runs through a cream tunnel with a dark mouth at each end that lets out the steam, a stack on the roof and a fan that
    turns beside it. The pressed pieces come in at +y and leave toward -y. The shaft stub that brings the Drive in sticks out of the right side, at the middle of the tile, on the axis of
    the Shafts."""
    parts = belt(-0.5, 0.5)
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("wall_l", -0.34, -0.2, -0.3, 0.3, 0.3, 0.72, P["cream"]), block("wall_r", 0.2, 0.34, -0.3, 0.3, 0.3, 0.72, P["cream"]),
              block("band_l", -0.35, -0.2, -0.31, 0.31, 0.3, 0.34, P["blue"]), block("band_r", 0.2, 0.35, -0.31, 0.31, 0.3, 0.34, P["blue"]),
              block("roof", -0.36, 0.36, -0.32, 0.32, 0.72, 0.84, P["cream"]), block("roof_cap", -0.38, 0.38, -0.34, 0.34, 0.82, 0.86, P["navy"]),
              block("base", -0.36, 0.36, -0.32, 0.32, 0.26, 0.32, P["navy"]),
              block("mouth_front", -0.2, 0.2, -0.32, -0.3, 0.44, 0.7, P["black"]), block("mouth_back", -0.2, 0.2, 0.3, 0.32, 0.44, 0.7, P["black"]),
              block("lip_front", -0.22, 0.22, -0.33, -0.3, 0.7, 0.76, P["steel_dark"]), block("lip_back", -0.22, 0.22, 0.3, 0.33, 0.7, 0.76, P["steel_dark"]),
              block("steam_front", -0.15, 0.15, -0.325, -0.32, 0.46, 0.62, P["white"]), block("steam_back", -0.15, 0.15, 0.32, 0.325, 0.46, 0.62, P["white"]),
              block("piece_a", -0.1, 0.1, -0.22, -0.04, BELT_Z, BELT_Z + 0.06, P["yarn_blue"]), block("piece_b", -0.1, 0.1, 0.12, 0.3, BELT_Z, BELT_Z + 0.06, P["yarn_green"]),
              block("stripe_a", -0.1, 0.1, -0.16, -0.12, BELT_Z + 0.06, BELT_Z + 0.065, P["white"]),
              disc("stack", 0.07, 0.3, (0.18, 0.0, 0.86), P["steel"], 8), disc("stack_cap", 0.095, 0.03, (0.18, 0.0, 1.16), P["steel_dark"], 8), disc("puff", 0.08, 0.05, (0.18, 0.0, 1.2), P["white"], 8),
              block("panel", -0.38, -0.34, -0.12, 0.12, 0.5, 0.68, P["iron"]), block("screen", -0.384, -0.38, -0.08, 0.08, 0.56, 0.64, P["glass"]),
              block("gearbox", 0.34, 0.42, -0.08, 0.08, 0.26, 0.42, P["iron"]), sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=0.0, z=DRIVE_Z)]
    parts += [disc("fan_stem", 0.02, 0.04, (-0.15, 0.0, 0.86), P["iron"], 6)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=0.0, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=0.0, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.09, 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    fan = [block("fan_a", -0.27, -0.03, -0.02, 0.02, 0.9, 0.93, P["steel"]), block("fan_b", -0.17, -0.13, -0.12, 0.12, 0.9, 0.93, P["steel"]), disc("fan_hub", 0.035, 0.05, (-0.15, 0.0, 0.88), P["steel_dark"], 6)]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-up": (fan, (-0.15, 0.0, 0.91))}


def counter_exit(rng):
    """Exit that is a piece of wall, centred on its tile like a partition and in line with the partitions beside it: its ears are the same half-height wall, cream with a blue band,
    plinths and a wooden cap, running to both sides of the tile. A short stub of belt comes in from the room (-y) at BELT_Z, goes through a hatch left in the wall, under a lintel that
    stands above the pieces, and ends in a glass display case on the shop side (+y), where the seller serves them: a sweater, gloves, a hat and a scarf on two shelves. The pieces travel
    toward +y."""
    h = THICK / 2
    top = 0.5
    parts = belt(-0.5, -0.08)
    for k, y in enumerate((-0.44, -0.24)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    for k, (x0, x1) in enumerate(((-0.5, -0.25), (0.25, 0.5))):
        parts += [block(f"ear{k}", x0, x1, -h, h, 0.0, top, P["cream"]), block(f"ear_cap{k}", x0, x1, -h, h, top - 0.015, top, P["wood"]),
                  block(f"ear_plinth_a{k}", x0, x1, h, h + 0.03, 0.0, 0.06, P["navy"]), block(f"ear_plinth_b{k}", x0, x1, -h - 0.03, -h, 0.0, 0.06, P["navy"]),
                  block(f"ear_band_a{k}", x0, x1, h, h + 0.015, 0.3, 0.47, P["blue"]), block(f"ear_band_b{k}", x0, x1, -h - 0.015, -h, 0.3, 0.47, P["blue"])]
    parts += [block("post_l", -0.28, -0.22, -h - 0.02, h + 0.02, 0.0, 0.58, P["navy"]), block("post_r", 0.22, 0.28, -h - 0.02, h + 0.02, 0.0, 0.58, P["navy"]),
              block("lintel", -0.3, 0.3, -h - 0.03, h + 0.03, 0.54, 0.6, P["blue"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.6, 0.64, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.64, 0.7, P["green"])]
    parts += [block("case_base", -0.36, 0.36, h + 0.01, 0.5, 0.0, 0.36, P["wood"]), block("case_front", -0.37, 0.37, 0.46, 0.5, 0.0, 0.38, P["wood_dark"]),
              block("case_top", -0.37, 0.37, h + 0.01, 0.5, 0.36, 0.4, P["blue"]),
              block("case_post_l", -0.36, -0.32, 0.46, 0.5, 0.4, 0.8, P["wood_dark"]), block("case_post_r", 0.32, 0.36, 0.46, 0.5, 0.4, 0.8, P["wood_dark"]),
              block("case_glass", -0.32, 0.32, 0.47, 0.49, 0.4, 0.76, P["glass"]), block("case_roof", -0.37, 0.37, h + 0.01, 0.5, 0.78, 0.82, P["blue"]),
              block("case_shelf", -0.34, 0.34, 0.2, 0.46, 0.58, 0.6, P["wood"]),
              block("sweater", -0.3, -0.1, 0.22, 0.38, 0.4, 0.48, P["yarn_red"]), block("sweater_neck", -0.24, -0.16, 0.22, 0.38, 0.48, 0.5, P["white"]),
              block("gloves", -0.04, 0.12, 0.24, 0.36, 0.4, 0.44, P["yarn_yellow"]), block("scarf", 0.16, 0.32, 0.22, 0.38, 0.4, 0.46, P["yarn_green"]),
              block("scarf_stripe", 0.16, 0.32, 0.27, 0.3, 0.46, 0.462, P["white"]),
              block("hat", -0.2, -0.04, 0.26, 0.4, 0.6, 0.68, P["yarn_blue"]), block("hat_pom", -0.14, -0.1, 0.31, 0.35, 0.68, 0.72, P["white"]),
              block("scarf_up", 0.04, 0.28, 0.26, 0.4, 0.6, 0.65, P["yarn_yellow"])]
    return parts, {}


def mirrored(builder):
    """The model a builder draws, turned into its mirror image across the x = 0 plane, with the pivots of its moving parts."""
    def build(rng):
        parts, spinners = builder(rng)
        flipped = {name: ([lpm.scale(part, sx=-1) for part in group], (-pivot[0], pivot[1], pivot[2])) for name, (group, pivot) in spinners.items()}
        return [lpm.scale(part, sx=-1) for part in parts], flipped
    return build


def check_floor(rng):
    """Light tile floor centred on the origin, with pale blue squares, like the walls."""
    return checker_floor(P, "tile", "tile_dark", cells=2)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    """The coloured band keeps its place on the wall (from 0.3), cut under the cap of the lower wall."""
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def cream_wall(rng):
    return half_height(thick_wall(P, "cream", "blue", "navy", "wood"))


def cream_partition(rng):
    return half_height(partition_wall(P, "cream", "blue", "navy", "wood"))


def cream_junction(arms):
    return lambda rng: half_height(junction_wall(P, "cream", "blue", "navy", "wood", arms))


def cream_corner(rng):
    return half_height(thick_corner(P, "cream", "blue", "navy", "wood"))


def wall_set():
    return {"floor": check_floor, "wall": cream_wall, "partition": cream_partition, "partition-elbow": cream_junction("ES"), "partition-tee": cream_junction("WES"),
            "partition-cross": cream_junction("ESWN"), "wall-corner": cream_corner}


if __name__ == "__main__":
    models = {"knitter": knitter, "knitter-left": mirrored(knitter), "finisher": finisher, "finisher-left": mirrored(finisher), "counter-exit": counter_exit}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
