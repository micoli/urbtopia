import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall, wall_variants  # noqa: E402

P = lpm.Palette([
    ("glass", "#cfeefa", 0.0, 0.2),
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7), ("blue", "#2f7de1", 0.0, 0.5),
    ("water", "#7ec8f0", 0.0, 0.2), ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9),
    ("belt", "#33363f", 0.0, 0.9), ("soil", "#7a5a3a", 0.0, 0.95), ("soil_dark", "#5e4329", 0.0, 0.95), ("soil_light", "#9a7650", 0.0, 0.95),
    ("sage", "#a9c98a", 0.0, 0.9), ("sage_dark", "#5f8a4a", 0.0, 0.9), ("leaf", "#4f9a3a", 0.0, 0.8), ("tomato", "#d8402e", 0.0, 0.7), ("carrot", "#e8873a", 0.0, 0.7),
    ("wheat", "#e8c96a", 0.0, 0.8), ("pumpkin", "#e59a2f", 0.0, 0.7), ("sack", "#d8c8a0", 0.0, 0.95),
    ("teal", "#2f9e8f", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5),
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


def legs(ys):
    parts = []
    for k, y in enumerate(ys):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    return parts


def flange(x, y, z, name):
    return sideways(disc(name, 0.07, 0.03, (0, 0, 0), P["blue_dark"], 8), x=x, y=y, z=z)


def flow_inlet(y):
    """The pipe stub that brings the Flow in through the right side, at the height of the pipes."""
    return [block("pipe_box", 0.4, 0.46, y - 0.1, y + 0.1, 0.26, 0.42, P["iron"]), sideways(disc("inlet", 0.045, 0.16, (0, 0, 0), P["steel"], 8), x=0.34, y=y, z=DRIVE_Z), flange(0.46, y, DRIVE_Z, "inlet_flange")]


def drive_stub(y):
    """The shaft stub that brings the Drive in through the right side, on the axis of the Shafts, with the pulley that turns."""
    parts = [block("gearbox", 0.4, 0.46, y - 0.08, y + 0.08, 0.26, 0.42, P["iron"]), sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=y, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=y, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=y, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, y - 0.09, y + 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    return parts, pulley


def produce(name, x, y, z, color):
    return disc(name, 0.035, 0.05, (x, y, z), P[color], 6)


def intake(rng):
    """Intake standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a wooden cabinet with a green band and
    a wooden hopper heaped with the harvest on top, and a mouth that lets the produce fall on the belt at BELT_Z, which ends on the front edge of the tile where the first Conveyor
    begins. It takes no Drive: the harvest falls by itself."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.7, P["wood"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["sage_dark"]),
             block("body_top", -0.41, 0.41, front - 0.01, 0.0, 0.68, 0.72, P["wood_dark"]),
             block("hopper_front", -0.32, 0.32, -0.4, -0.36, 0.72, 1.02, P["wood_light"]), block("hopper_back", -0.32, 0.32, -0.04, 0.0, 0.72, 1.02, P["wood_light"]),
             block("hopper_l", -0.34, -0.3, -0.4, 0.0, 0.72, 1.02, P["wood_light"]), block("hopper_r", 0.3, 0.34, -0.4, 0.0, 0.72, 1.02, P["wood_light"]),
             block("hopper_rim", -0.36, 0.36, -0.42, 0.02, 1.0, 1.04, P["wood_dark"]), block("heap", -0.3, 0.3, -0.36, -0.04, 0.9, 1.0, P["soil_light"])]
    for k, (x, y, c) in enumerate(((-0.18, -0.28, "tomato"), (0.0, -0.2, "carrot"), (0.16, -0.3, "pumpkin"), (-0.08, -0.1, "leaf"), (0.2, -0.12, "tomato"))):
        parts.append(produce(f"veg{k}", x, y, 1.0, c))
    parts += [block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.6, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.6, 0.64, P["steel_dark"]),
              block("mouth_frame_l", -0.22, -0.2, front - 0.02, front, 0.36, 0.6, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, front - 0.02, front, 0.36, 0.6, P["steel_dark"]),
              block("tray", -0.16, 0.16, front - 0.12, front, BELT_Z, BELT_Z + 0.02, P["steel"]),
              block("pile", -0.1, 0.1, front - 0.1, front - 0.02, BELT_Z + 0.02, BELT_Z + 0.07, P["soil_light"])]
    parts += belt(-1.0, front) + [block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    return shifted(parts, 0.5), {}


def washer(rng):
    """Washer that a Line passes through, along y: the belt runs under a blue tub of water with a bar of spray nozzles, between two splash curtains, and a flanged pipe brings the Flow
    in through the right side. The produce comes in at +y and leaves toward -y. A paddle wheel turns in the tub."""
    parts = belt(-0.5, 0.5) + legs((-0.42, 0.42))
    parts += [block("tub_l", -0.34, -0.2, -0.32, 0.32, 0.3, 0.7, P["blue"]), block("tub_r", 0.2, 0.34, -0.32, 0.32, 0.3, 0.7, P["blue"]),
              block("tub_top", -0.36, 0.36, -0.34, 0.34, 0.7, 0.78, P["blue_dark"]), block("tub_water", -0.3, 0.3, -0.28, 0.28, 0.78, 0.82, P["water"]),
              block("tub_rim_f", -0.36, 0.36, -0.34, -0.3, 0.78, 0.86, P["blue_dark"]), block("tub_rim_b", -0.36, 0.36, 0.3, 0.34, 0.78, 0.86, P["blue_dark"]),
              block("tub_rim_l", -0.36, -0.32, -0.3, 0.3, 0.78, 0.86, P["blue_dark"]), block("tub_rim_r", 0.32, 0.36, -0.3, 0.3, 0.78, 0.86, P["blue_dark"]),
              block("base", -0.36, 0.36, -0.34, 0.34, 0.26, 0.32, P["blue_dark"]),
              block("curtain_f", -0.2, 0.2, -0.33, -0.31, 0.5, 0.7, P["belt"]), block("curtain_b", -0.2, 0.2, 0.31, 0.33, 0.5, 0.7, P["belt"]),
              block("spray_bar", -0.2, 0.2, -0.02, 0.02, 0.58, 0.62, P["steel"])]
    for k, x in enumerate((-0.14, -0.05, 0.05, 0.14)):
        parts.append(block(f"nozzle{k}", x - 0.015, x + 0.015, -0.015, 0.015, 0.5, 0.58, P["steel_dark"]))
    parts += [produce("veg_a", -0.06, -0.12, BELT_Z, "carrot"), produce("veg_b", 0.06, 0.16, BELT_Z, "tomato")]
    parts += flow_inlet(0.0)
    wheel = [block("wheel_a", -0.2, 0.2, -0.02, 0.02, 0.84, 0.87, P["teal"]), block("wheel_b", -0.02, 0.02, -0.2, 0.2, 0.84, 0.87, P["teal"]), disc("wheel_hub", 0.035, 0.05, (0, 0, 0.82), P["steel_dark"], 6)]
    return parts, {"spin-up": (wheel, (0.0, 0.0, 0.85))}


def thresher(rng):
    """Thresher that a Line passes through, along y: the belt runs through a red drum casing with a hopper on top and a rotor that turns, a pulley brings the Drive in through the right
    side. The produce comes in at +y and leaves toward -y."""
    parts = belt(-0.5, 0.5) + legs((-0.42, 0.42))
    parts += [block("case_l", -0.34, -0.2, -0.34, 0.34, 0.3, 0.74, P["red"]), block("case_r", 0.2, 0.34, -0.34, 0.34, 0.3, 0.74, P["red"]),
              block("case_top", -0.36, 0.36, -0.36, 0.36, 0.74, 0.86, P["wood_dark"]), block("case_base", -0.36, 0.36, -0.36, 0.36, 0.26, 0.32, P["wood_dark"]),
              block("arch_f", -0.2, 0.2, -0.36, -0.34, 0.6, 0.74, P["black"]), block("arch_b", -0.2, 0.2, 0.34, 0.36, 0.6, 0.74, P["black"]),
              block("hopper", -0.16, 0.16, -0.16, 0.16, 0.86, 1.0, P["wood_light"]), block("hopper_rim", -0.2, 0.2, -0.2, 0.2, 0.98, 1.02, P["wood_dark"]),
              block("grain", -0.14, 0.14, -0.14, 0.14, 0.96, 1.0, P["wheat"]), block("chute", -0.1, 0.1, -0.34, -0.2, 0.3, 0.34, P["steel_dark"])]
    box, pulley = drive_stub(0.0)
    parts += box
    rotor = [disc("rotor", 0.1, 0.26, (0.0, 0.0, 0.5), P["steel"], 8), block("rotor_bar_a", -0.16, 0.16, -0.02, 0.02, 0.58, 0.6, P["iron"]), block("rotor_bar_b", -0.02, 0.02, -0.16, 0.16, 0.58, 0.6, P["iron"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-up": (rotor, (0.0, 0.0, 0.5))}


def grader(rng):
    """Grader that a Line passes through, along y: the belt runs between two vibrating screens in a green frame with a row of sorting chutes, a pulley brings the Drive in through the
    right side. The produce comes in at +y and leaves toward -y."""
    parts = belt(-0.5, 0.5) + legs((-0.42, 0.42))
    parts += [block("frame_l", -0.34, -0.2, -0.34, 0.34, 0.3, 0.6, P["sage_dark"]), block("frame_r", 0.2, 0.34, -0.34, 0.34, 0.3, 0.6, P["sage_dark"]),
              block("frame_top", -0.36, 0.36, -0.36, 0.36, 0.6, 0.66, P["wood_dark"]), block("base", -0.36, 0.36, -0.36, 0.36, 0.26, 0.32, P["wood_dark"]),
              block("arch_f", -0.2, 0.2, -0.36, -0.34, 0.5, 0.6, P["black"]), block("arch_b", -0.2, 0.2, 0.34, 0.36, 0.5, 0.6, P["black"]),
              block("screen_l", -0.3, -0.22, -0.3, 0.3, 0.62, 0.66, P["steel"]), block("screen_r", 0.22, 0.3, -0.3, 0.3, 0.62, 0.66, P["steel"])]
    for k, (y, color) in enumerate(((-0.22, "tomato"), (0.0, "carrot"), (0.22, "pumpkin"))):
        parts += [block(f"chute{k}", -0.38, -0.34, y - 0.06, y + 0.06, 0.34, 0.5, P["wood"]), block(f"bin{k}", -0.46, -0.34, y - 0.07, y + 0.07, 0.26, 0.34, P["wood_dark"]), produce(f"bin_veg{k}", -0.4, y, 0.34, color)]
    box, pulley = drive_stub(0.0)
    parts += box
    shaker = [block("shake_a", -0.2, 0.2, -0.3, -0.26, 0.7, 0.74, P["iron"]), block("shake_b", -0.2, 0.2, 0.26, 0.3, 0.7, 0.74, P["iron"]), disc("shake_hub", 0.045, 0.06, (0, 0, 0.68), P["brass"], 6)]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-up": (shaker, (0.0, 0.0, 0.7))}


def harvest_bin(rng):
    """Exit that is a piece of wall, centred on its tile like a partition and in line with the partitions beside it: its ears are the same half-height wall, wooden planks with a green band,
    dark plinths and cap, running to both sides of the tile. A short stub of belt comes in from the room (-y) at BELT_Z, goes through a hatch left in the wall, under a lintel, and drops the
    produce into a wooden bin on the lorry side (+y), heaped with tomatoes, carrots and pumpkins, beside a sack of grain. The produce travels toward +y."""
    h = 0.07
    top = 0.5
    parts = belt(-0.5, -0.08) + legs((-0.44, -0.24))
    for k, (x0, x1) in enumerate(((-0.5, -0.25), (0.25, 0.5))):
        parts += [block(f"ear{k}", x0, x1, -h, h, 0.0, top, P["wood"]), block(f"ear_cap{k}", x0, x1, -h, h, top - 0.015, top, P["wood_dark"]),
                  block(f"ear_plinth_a{k}", x0, x1, h, h + 0.03, 0.0, 0.06, P["wood_dark"]), block(f"ear_plinth_b{k}", x0, x1, -h - 0.03, -h, 0.0, 0.06, P["wood_dark"]),
                  block(f"ear_band_a{k}", x0, x1, h, h + 0.015, 0.3, 0.47, P["sage_dark"]), block(f"ear_band_b{k}", x0, x1, -h - 0.015, -h, 0.3, 0.47, P["sage_dark"])]
    parts += [block("post_l", -0.28, -0.22, -h - 0.02, h + 0.02, 0.0, 0.58, P["wood_dark"]), block("post_r", 0.22, 0.28, -h - 0.02, h + 0.02, 0.0, 0.58, P["wood_dark"]),
              block("lintel", -0.3, 0.3, -h - 0.03, h + 0.03, 0.54, 0.6, P["sage_dark"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.6, 0.64, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.64, 0.7, P["green"]),
              block("drop_plate", -0.17, 0.17, -0.08, 0.2, 0.34, 0.37, P["steel"]), block("drop_lip", -0.17, 0.17, 0.18, 0.22, 0.3, 0.37, P["steel_dark"])]
    parts += [block("bay", -0.42, 0.42, h + 0.01, 0.5, 0.0, 0.1, P["wood_dark"]),
              block("bin_back", -0.4, 0.1, 0.46, 0.5, 0.1, 0.3, P["wood_light"]), block("bin_front", -0.4, 0.1, 0.18, 0.22, 0.1, 0.3, P["wood_light"]),
              block("bin_l", -0.4, -0.36, 0.18, 0.5, 0.1, 0.3, P["wood_light"]), block("bin_r", 0.06, 0.1, 0.18, 0.5, 0.1, 0.3, P["wood_light"]),
              block("bin_rim", -0.42, 0.12, 0.16, 0.2, 0.28, 0.31, P["wood_dark"]), block("bin_fill", -0.36, 0.06, 0.22, 0.46, 0.1, 0.26, P["soil_light"])]
    for k, (x, y, c) in enumerate(((-0.28, 0.3, "tomato"), (-0.16, 0.38, "carrot"), (-0.04, 0.3, "pumpkin"), (-0.24, 0.42, "pumpkin"), (-0.1, 0.26, "tomato"), (0.0, 0.4, "carrot"))):
        parts.append(produce(f"bin_veg{k}", x, y, 0.26, c))
    parts += [block("sack", 0.2, 0.38, 0.26, 0.46, 0.1, 0.34, P["sack"]), block("sack_tie", 0.22, 0.36, 0.28, 0.44, 0.34, 0.38, P["wood_dark"]),
              block("sack_grain", 0.24, 0.34, 0.3, 0.42, 0.38, 0.4, P["wheat"])]
    return parts, {}


def sprinkler(rng):
    """Sprinkler standing on its tile, its face toward -y: a blue standpipe on a wooden foot with a rotating arm of two nozzles that sprays a ring of drops over a bed of soil with seedlings,
    a flanged pipe brings the Flow in through the right side at the height of the pipes."""
    parts = [block("bed", -0.46, 0.46, -0.46, 0.46, 0.0, 0.06, P["soil"]), block("bed_edge_b", -0.46, 0.46, 0.42, 0.46, 0.06, 0.12, P["wood_dark"]), block("bed_edge_f", -0.46, 0.46, -0.46, -0.42, 0.06, 0.12, P["wood_dark"]),
             block("bed_edge_l", -0.46, -0.42, -0.42, 0.42, 0.06, 0.12, P["wood_dark"]), block("bed_edge_r", 0.42, 0.46, -0.42, 0.42, 0.06, 0.12, P["wood_dark"]),
             block("furrow_a", -0.38, 0.38, -0.2, -0.16, 0.06, 0.08, P["soil_dark"]), block("furrow_b", -0.38, 0.38, 0.16, 0.2, 0.06, 0.08, P["soil_dark"]),
             disc("foot", 0.1, 0.08, (0, 0, 0.06), P["wood_dark"], 8), disc("pole", 0.04, 0.5, (0, 0, 0.14), P["blue"], 8), disc("collar", 0.06, 0.03, (0, 0, 0.5), P["blue_dark"], 8)]
    for k, (x, y) in enumerate(((-0.3, -0.3), (-0.1, -0.3), (0.1, -0.3), (0.3, -0.3), (-0.3, 0.3), (-0.1, 0.3), (0.1, 0.3), (0.3, 0.3))):
        parts += [block(f"stem{k}", x - 0.012, x + 0.012, y - 0.012, y + 0.012, 0.08, 0.16, P["leaf"]), block(f"leaf{k}", x - 0.04, x + 0.04, y - 0.012, y + 0.012, 0.14, 0.17, P["green"])]
    parts += [block("pipe_box", 0.4, 0.46, -0.1, 0.1, 0.26, 0.42, P["iron"]), sideways(disc("inlet", 0.045, 0.34, (0, 0, 0), P["steel"], 8), x=0.12, y=0.0, z=0.12), flange(0.46, 0.0, 0.34, "inlet_flange"),
              block("riser", 0.1, 0.14, -0.02, 0.02, 0.12, 0.34, P["steel"])]
    arm = [block("arm_a", -0.3, 0.3, -0.025, 0.025, 0.56, 0.6, P["steel"]), block("nozzle_a", -0.32, -0.26, -0.03, 0.03, 0.52, 0.6, P["steel_dark"]), block("nozzle_b", 0.26, 0.32, -0.03, 0.03, 0.52, 0.6, P["steel_dark"]),
           block("drop_a", -0.31, -0.27, -0.015, 0.015, 0.36, 0.5, P["water"]), block("drop_b", 0.27, 0.31, -0.015, 0.015, 0.36, 0.5, P["water"]), disc("arm_hub", 0.04, 0.06, (0, 0, 0.55), P["brass"], 6)]
    return parts, {"spin-up": (arm, (0.0, 0.0, 0.58))}


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


def soil_floor(rng):
    """Packed-earth floor tile centred on the origin, like the walls."""
    return checker_floor(P, "soil", "soil_dark", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    """The coloured band keeps its place on the wall (from 0.3), cut under the cap of the lower wall."""
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def plank_wall(rng):
    return half_height(thick_wall(P, "wood", "sage_dark", "wood_dark", "wood_dark"))


def plank_partition(rng):
    return half_height(partition_wall(P, "wood", "sage_dark", "wood_dark", "wood_dark"))


def plank_junction(arms):
    return lambda rng: half_height(junction_wall(P, "wood", "sage_dark", "wood_dark", "wood_dark", arms))


def plank_corner(rng):
    return half_height(thick_corner(P, "wood", "sage_dark", "wood_dark", "wood_dark"))


def wall_set():
    return {"floor": soil_floor, "wall": plank_wall, "partition": plank_partition, "partition-elbow": plank_junction("ES"), "partition-tee": plank_junction("WES"),
            "partition-cross": plank_junction("ESWN"), "wall-corner": plank_corner, **wall_variants(P, "wood", "sage_dark", "wood_dark", "wood_dark", "half")}


if __name__ == "__main__":
    models = {"intake": intake, "washer": washer, "washer-left": mirrored(washer), "thresher": thresher, "thresher-left": mirrored(thresher), "grader": grader, "grader-left": mirrored(grader),
              "harvest-bin": harvest_bin, "sprinkler": sprinkler, "sprinkler-left": mirrored(sprinkler)}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
