import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, disc  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("white", "#f6f2ea", 0.0, 0.9), ("glass", "#cfeefa", 0.0, 0.2), ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5),
    ("olive", "#5d8f6a", 0.2, 0.5), ("olive_dark", "#3f6b4a", 0.2, 0.5),
    ("belt", "#33363f", 0.0, 0.9), ("kraft", "#c9a26b", 0.0, 0.9), ("kraft_dark", "#a8814a", 0.0, 0.9), ("tape", "#e9dfc9", 0.0, 0.6),
])

# Height of the top of a Conveyor belt, and of the axis of the Drive: the Packer's output and every Conveyor meet at BELT_Z.
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


def packet(name, x0, x1, y0, y1, z0, z1):
    """A kraft box closed by a strip of tape along its top."""
    middle = (x0 + x1) / 2
    return [block(name, x0, x1, y0, y1, z0, z1, P["kraft"]), block(f"{name}_tape", middle - 0.015, middle + 0.015, y0, y1, z1, z1 + 0.004, P["tape"])]


def packer(rng):
    """Packer standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a cabinet with a hopper
    on top and a control panel, a mouth that pushes a packet onto the belt at BELT_Z, which ends on the front edge of the tile where the first Conveyor of the Line
    begins. A shaft stub on the right brings the Drive in."""
    parts = [block("body", -0.4, 0.4, -0.36, 0.0, 0.26, 0.86, P["olive"]), block("body_band", -0.41, 0.41, -0.37, 0.0, 0.26, 0.3, P["olive_dark"]),
             block("body_top", -0.41, 0.41, -0.37, 0.0, 0.84, 0.88, P["olive_dark"]),
             block("hopper_base", -0.26, 0.26, -0.3, -0.04, 0.88, 0.96, P["steel_dark"]), block("hopper_lip", -0.3, 0.3, -0.34, 0.0, 0.96, 1.0, P["steel"]),
             block("hopper_in", -0.24, 0.24, -0.28, -0.06, 0.99, 1.0, P["black"]),
             block("mouth", -0.2, 0.2, -0.375, -0.36, 0.36, 0.6, P["black"]), block("mouth_frame_t", -0.22, 0.22, -0.38, -0.36, 0.6, 0.64, P["steel_dark"]),
             block("mouth_frame_l", -0.22, -0.2, -0.38, -0.36, 0.36, 0.6, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, -0.38, -0.36, 0.36, 0.6, P["steel_dark"]),
             block("panel", 0.0, 0.34, -0.375, -0.36, 0.66, 0.8, P["iron"]), block("screen", 0.03, 0.2, -0.38, -0.375, 0.7, 0.78, P["glass"]),
             block("button_red", 0.24, 0.28, -0.38, -0.375, 0.74, 0.78, P["red"]), block("button_green", 0.29, 0.33, -0.38, -0.375, 0.74, 0.78, P["green"]),
             block("lamp_stem", -0.3, -0.26, -0.2, -0.16, 1.0, 1.04, P["steel_dark"]), block("lamp", -0.31, -0.25, -0.21, -0.15, 1.04, 1.1, P["yellow"]),
             block("belt_rail_l", -0.2, -0.17, -1.0, -0.36, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -1.0, -0.36, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -1.0, -0.36, 0.3, 0.4, P["belt"]),
             block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    parts += packet("packet", -0.1, 0.1, -0.48, -0.3, 0.4, 0.56)
    parts += [block("bracket", 0.4, 0.46, -0.1, -0.02, 0.28, 0.4, P["iron"]),
              sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=-0.06, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=-0.06, z=DRIVE_Z),
              sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=-0.06, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.06 - 0.09, -0.06 + 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    return shifted(parts, 0.5), {"spin-x": (shifted(pulley, 0.5), (0.46, 0.44, DRIVE_Z))}


def arrow(name, x, y, turn=0, color="yellow", size=0.09):
    """A flat arrow on the belt that points toward -y (turn 0), toward +x (turn 90), toward -x (turn -90) or toward +y (turn 180)."""
    head = lpm.prism(f"{name}_head", 3, size, 0.004, at=(0, 0, BELT_Z - 0.02), color=P[color])
    lpm.rotate(head, 30 + turn, axis="Z")
    lpm.move(head, x, y, 0)
    if turn == 180:
        tail = block(f"{name}_tail", x - size * 0.22, x + size * 0.22, y - size * 1.0, y - size * 0.3, BELT_Z - 0.02, BELT_Z - 0.016, P[color])
    elif turn == 0:
        tail = block(f"{name}_tail", x - size * 0.22, x + size * 0.22, y + size * 0.3, y + size * 1.0, BELT_Z - 0.02, BELT_Z - 0.016, P[color])
    else:
        behind = -1 if turn == 90 else 1
        tail = block(f"{name}_tail", x + behind * size * 0.3 if behind > 0 else x - size * 1.0, x + size * 1.0 if behind > 0 else x - size * 0.3, y - size * 0.22, y + size * 0.22,
                     BELT_Z - 0.02, BELT_Z - 0.016, P[color])
    return [head, tail]


def conveyor_straight(rng):
    """Straight Conveyor carrying toward -y, from edge to edge of its tile: two steel rails and a black belt at BELT_Z, a yellow arrow on the belt, two legs at each end."""
    parts = [block("belt_rail_l", -0.2, -0.17, -0.5, 0.5, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -0.5, 0.5, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -0.5, 0.5, 0.3, BELT_Z - 0.02, P["belt"])]
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]),
                  block(f"brace{k}", -0.2, 0.2, y - 0.02, y + 0.02, 0.12, 0.15, P["iron"])]
    return parts + arrow("arrow", 0.0, 0.0)


def conveyor_tee(rng):
    """T Conveyor that merges: the Packets come in from the left and from the right along x and leave toward -y. The back is closed by a rail, so a Line fed on one
    side only turns a corner. Arrows on both arms point at the junction, one on the stem points out."""
    parts = [block("belt_bed_bar", -0.5, 0.5, -0.17, 0.17, 0.3, BELT_Z - 0.02, P["belt"]), block("belt_bed_stem", -0.17, 0.17, -0.5, -0.17, 0.3, BELT_Z - 0.02, P["belt"]),
             block("rail_back", -0.5, 0.5, 0.17, 0.2, 0.3, BELT_Z, P["steel"]),
             block("rail_front_l", -0.5, -0.2, -0.2, -0.17, 0.3, BELT_Z, P["steel"]), block("rail_front_r", 0.2, 0.5, -0.2, -0.17, 0.3, BELT_Z, P["steel"]),
             block("rail_stem_l", -0.2, -0.17, -0.5, -0.17, 0.3, BELT_Z, P["steel"]), block("rail_stem_r", 0.17, 0.2, -0.5, -0.17, 0.3, BELT_Z, P["steel"]),
             block("junction_plate", -0.17, 0.17, -0.17, 0.17, BELT_Z - 0.02, BELT_Z - 0.016, P["steel_dark"])]
    for k, (x, y) in enumerate(((-0.44, 0.17), (0.44, 0.17), (-0.44, -0.17), (0.44, -0.17), (-0.17, -0.44), (0.17, -0.44))):
        parts.append(block(f"leg{k}", x - 0.03, x + 0.03, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]))
    return parts + arrow("arrow_l", -0.33, 0.0, 90) + arrow("arrow_r", 0.33, 0.0, -90) + arrow("arrow_out", 0.0, -0.36)


REEL_X = -0.36
REEL_Z = 0.8


def strapper(rng):
    """Strapper that a Line passes through, along y: the belt of a straight Conveyor runs under an arch, whose head binds a packet with a white band. The Packets come
    in at +y and leave toward -y. A reel of band turns on the left post, and a shaft stub on the right brings the Drive in through a gearbox."""
    parts = conveyor_straight(rng)
    parts += [block("post_l", -0.3, -0.2, -0.2, 0.2, 0.3, 0.84, P["olive"]), block("post_r", 0.2, 0.3, -0.2, 0.2, 0.3, 0.84, P["olive"]),
              block("foot_l", -0.32, -0.2, -0.22, 0.22, 0.26, 0.32, P["olive_dark"]), block("foot_r", 0.2, 0.32, -0.22, 0.22, 0.26, 0.32, P["olive_dark"]),
              block("beam", -0.32, 0.32, -0.22, 0.22, 0.84, 0.96, P["olive"]), block("beam_cap", -0.33, 0.33, -0.23, 0.23, 0.94, 0.98, P["olive_dark"]),
              block("head", -0.14, 0.14, -0.14, 0.14, 0.7, 0.84, P["steel_dark"]), block("head_nose", -0.1, 0.1, -0.16, 0.16, 0.66, 0.7, P["iron"]),
              block("band_top", -0.14, 0.14, -0.006, 0.006, 0.6, 0.612, P["white"]), block("band_l", -0.14, -0.128, -0.006, 0.006, 0.4, 0.612, P["white"]),
              block("band_r", 0.128, 0.14, -0.006, 0.006, 0.4, 0.612, P["white"]),
              block("lamp_stem", 0.22, 0.26, -0.02, 0.02, 0.98, 1.02, P["steel_dark"]), block("lamp", 0.21, 0.27, -0.03, 0.03, 1.02, 1.08, P["green"]),
              block("panel", 0.3, 0.32, -0.12, 0.12, 0.6, 0.78, P["iron"]), block("screen", 0.32, 0.325, -0.08, 0.08, 0.66, 0.74, P["glass"]),
              block("gearbox", 0.3, 0.4, -0.1, 0.1, 0.26, 0.46, P["iron"]), block("gearbox_cap", 0.3, 0.4, -0.11, 0.11, 0.44, 0.48, P["steel_dark"]),
              sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=0.0, z=DRIVE_Z)]
    parts += packet("packet", -0.1, 0.1, -0.1, 0.1, 0.4, 0.56)[:1]
    parts += [block("reel_arm", -0.4, -0.3, -0.03, 0.03, REEL_Z - 0.03, REEL_Z + 0.03, P["iron"]), horizontal(disc("reel_axle", 0.03, 0.12, (0, 0, 0), P["steel"], 6), x=REEL_X, y=-0.06, z=REEL_Z)]
    reel = [horizontal(disc("reel", 0.12, 0.05, (0, 0, 0), P["white"], 12), x=REEL_X, y=-0.025, z=REEL_Z),
            horizontal(disc("reel_core", 0.05, 0.07, (0, 0, 0), P["steel_dark"], 8), x=REEL_X, y=-0.035, z=REEL_Z),
            block("reel_spoke_a", REEL_X - 0.11, REEL_X + 0.11, -0.03, 0.03, REEL_Z - 0.012, REEL_Z + 0.012, P["steel"]),
            block("reel_spoke_b", REEL_X - 0.012, REEL_X + 0.012, -0.03, 0.03, REEL_Z - 0.11, REEL_Z + 0.11, P["steel"])]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=0.0, z=DRIVE_Z),
              sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=0.0, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.09, 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-y": (reel, (REEL_X, 0.0, REEL_Z))}


def exit_conveyor(rng):
    """Exit standing against a wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): the belt comes in from the room at
    BELT_Z, goes through a hatch of the wall under a rubber curtain and ends outside on a roller, where the last packet leaves. The Packets travel toward +y. A lamp on the hatch lights when the Line is Linked."""
    parts = [block("belt_rail_l", -0.2, -0.17, -1.0, 0.32, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -1.0, 0.32, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -1.0, 0.32, 0.3, BELT_Z - 0.02, P["belt"])]
    parts += [sideways(disc("end_roller", 0.04, 0.34, (0, 0, 0), P["steel_dark"], 8), x=-0.17, y=0.32, z=BELT_Z - 0.04)]
    for k, y in enumerate((-0.92, -0.5, -0.14, 0.26)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("hatch_l", -0.3, -0.22, -0.06, 0.04, 0.3, 0.72, P["olive_dark"]), block("hatch_r", 0.22, 0.3, -0.06, 0.04, 0.3, 0.72, P["olive_dark"]),
              block("hatch_top", -0.3, 0.3, -0.06, 0.04, 0.6, 0.72, P["olive_dark"]), block("hatch_cap", -0.32, 0.32, -0.07, 0.05, 0.7, 0.74, P["olive"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.74, 0.78, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.78, 0.84, P["green"])]
    parts += [block(f"hazard{k}", -0.28 + 0.1 * k, -0.28 + 0.1 * k + 0.05, -0.07, -0.065, 0.62, 0.68, P["yellow" if k % 2 == 0 else "black"]) for k in range(6)]
    parts += [block(f"curtain{k}", -0.22 + 0.088 * k, -0.22 + 0.088 * k + 0.08, -0.03, -0.01, 0.46, 0.6, P["belt"]) for k in range(5)]
    parts += packet("packet", -0.09, 0.09, 0.07, 0.25, 0.4, 0.55)[:1]
    return shifted(parts + arrow("arrow", 0.0, -0.8, 180), 0.5)


def scanner(rng):
    """Scanner that a Line passes through, along y: the belt of a straight Conveyor runs under a white arch, whose hood holds a camera and a lens and whose posts
    carry the red lines of the scan. A beacon turns on top. It needs no Drive. The Packets come in at +y and leave toward -y."""
    parts = conveyor_straight(rng)
    parts += [block("post_l", -0.3, -0.2, -0.18, 0.18, 0.3, 0.8, P["white"]), block("post_r", 0.2, 0.3, -0.18, 0.18, 0.3, 0.8, P["white"]),
              block("foot_l", -0.32, -0.2, -0.2, 0.2, 0.26, 0.32, P["blue_dark"]), block("foot_r", 0.2, 0.32, -0.2, 0.2, 0.26, 0.32, P["blue_dark"]),
              block("hood", -0.32, 0.32, -0.2, 0.2, 0.78, 0.92, P["white"]), block("hood_stripe", -0.33, 0.33, -0.21, 0.21, 0.78, 0.82, P["blue"]),
              block("hood_cap", -0.3, 0.3, -0.18, 0.18, 0.92, 0.95, P["blue_dark"]),
              block("lens_frame", -0.12, 0.12, -0.06, 0.06, 0.74, 0.78, P["iron"]), block("lens", -0.1, 0.1, -0.04, 0.04, 0.73, 0.74, P["glass"]),
              disc("camera", 0.05, 0.05, (0.2, 0.0, 0.95), P["iron"], 8), disc("camera_lens", 0.03, 0.02, (0.2, 0.0, 1.0), P["glass"], 8),
              block("panel", 0.3, 0.32, -0.1, 0.1, 0.56, 0.74, P["iron"]), block("screen", 0.32, 0.325, -0.07, 0.07, 0.6, 0.7, P["green"]),
              block("scan_top", -0.2, 0.2, -0.004, 0.004, 0.74, 0.745, P["red"]), block("scan_low", -0.2, 0.2, -0.004, 0.004, 0.43, 0.435, P["red"]),
              block("scan_l", -0.2, -0.195, -0.004, 0.004, 0.43, 0.745, P["red"]), block("scan_r", 0.195, 0.2, -0.004, 0.004, 0.43, 0.745, P["red"])]
    parts += packet("packet", -0.1, 0.1, -0.1, 0.1, 0.4, 0.56)[:1]
    parts += [disc("beacon_base", 0.06, 0.03, (0.0, 0.0, 0.95), P["iron"], 8)]
    beacon = [block("beacon_bar", -0.07, 0.07, -0.02, 0.02, 1.0, 1.04, P["red"]), disc("beacon_hub", 0.03, 0.05, (0.0, 0.0, 0.98), P["steel_dark"], 6)]
    return parts, {"spin-up": (beacon, (0.0, 0.0, 1.02))}


def truck(rng):
    """Delivery truck in the frame of an Exit, parked outside its wall: the open back of the cargo box faces the wall (toward -y) at y 0.86, its floor at BELT_Z, level with
    the roller of the Exit, and the cab points toward +y. It only drives in and out of the picture."""
    parts = [block("chassis", -0.2, 0.2, 0.36, 1.3, 0.2, 0.28, P["iron"]),
             block("cargo_floor", -0.25, 0.25, 0.36, 0.9, 0.28, 0.4, P["olive_dark"]),
             block("cargo_wall_l", -0.25, -0.22, 0.36, 0.9, 0.4, 0.78, P["olive"]), block("cargo_wall_r", 0.22, 0.25, 0.36, 0.9, 0.4, 0.78, P["olive"]),
             block("cargo_front", -0.25, 0.25, 0.87, 0.9, 0.4, 0.78, P["olive"]), block("cargo_roof", -0.26, 0.26, 0.35, 0.91, 0.78, 0.82, P["olive_dark"]),
             block("cargo_band_l", -0.26, -0.25, 0.36, 0.9, 0.5, 0.56, P["yellow"]), block("cargo_band_r", 0.25, 0.26, 0.36, 0.9, 0.5, 0.56, P["yellow"]),
             block("bumper", -0.24, 0.24, 0.32, 0.36, 0.2, 0.3, P["steel_dark"]),
             block("light_l", -0.22, -0.16, 0.355, 0.365, 0.46, 0.52, P["red"]), block("light_r", 0.16, 0.22, 0.355, 0.365, 0.46, 0.52, P["red"]),
             block("cab", -0.24, 0.24, 0.92, 1.24, 0.28, 0.74, P["white"]), block("cab_roof", -0.25, 0.25, 0.91, 1.25, 0.72, 0.76, P["olive_dark"]),
             block("windshield", -0.2, 0.2, 1.24, 1.245, 0.5, 0.7, P["glass"]), block("side_window_l", -0.245, -0.24, 0.98, 1.2, 0.5, 0.68, P["glass"]),
             block("side_window_r", 0.24, 0.245, 0.98, 1.2, 0.5, 0.68, P["glass"]),
             block("hood", -0.22, 0.22, 1.24, 1.36, 0.28, 0.5, P["white"]), block("grille", -0.16, 0.16, 1.36, 1.365, 0.32, 0.44, P["black"]),
             block("headlight_l", -0.21, -0.14, 1.355, 1.365, 0.42, 0.48, P["yellow"]), block("headlight_r", 0.14, 0.21, 1.355, 1.365, 0.42, 0.48, P["yellow"])]
    parts += packet("load_a", -0.2, -0.02, 0.62, 0.86, 0.4, 0.56)[:1] + packet("load_b", 0.02, 0.2, 0.62, 0.86, 0.4, 0.56)[:1] + packet("load_c", -0.1, 0.1, 0.62, 0.86, 0.56, 0.72)[:1]
    for k, (x, y) in enumerate(((-0.25, 0.6), (0.25, 0.6), (-0.25, 1.1), (0.25, 1.1))):
        tire = sideways(disc(f"tire{k}", 0.1, 0.07, (0, 0, 0), P["black"], 10), x=x - 0.035, y=y, z=0.1)
        hub = sideways(disc(f"hub{k}", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=x - 0.04, y=y, z=0.1)
        parts += [tire, hub]
    return shifted(parts, 0.5)


def elbow(side):
    """Elbow Conveyor: the Packets come in at +y, travelling toward -y, and turn to leave toward +x (side 1, a left turn for them) or toward -x (side -1, a right turn).
    The inner corner is closed by a rail, the outer corner by the two rails that meet."""
    def at(name, x0, x1, y0, y1, z0, z1, color):
        return block(name, min(x0 * side, x1 * side), max(x0 * side, x1 * side), y0, y1, z0, z1, P[color])

    def build(rng):
        parts = [at("bed_in", -0.17, 0.17, -0.17, 0.5, 0.3, BELT_Z - 0.02, "belt"), at("bed_out", 0.17, 0.5, -0.17, 0.17, 0.3, BELT_Z - 0.02, "belt"),
                 at("plate", -0.17, 0.17, -0.17, 0.17, BELT_Z - 0.02, BELT_Z - 0.016, "steel_dark"),
                 at("rail_outer_in", -0.2, -0.17, -0.2, 0.5, 0.3, BELT_Z, "steel"), at("rail_outer_out", -0.17, 0.5, -0.2, -0.17, 0.3, BELT_Z, "steel"),
                 at("rail_inner_in", 0.17, 0.2, 0.17, 0.5, 0.3, BELT_Z, "steel"), at("rail_inner_out", 0.2, 0.5, 0.17, 0.2, 0.3, BELT_Z, "steel"),
                 at("rail_inner_corner", 0.17, 0.2, 0.17, 0.2, 0.3, BELT_Z, "steel")]
        for k, (x, y) in enumerate(((-0.185, 0.42), (0.185, 0.42), (-0.185, -0.185), (0.42, -0.185), (0.42, 0.185))):
            parts.append(at(f"leg{k}", x - 0.03, x + 0.03, y - 0.03, y + 0.03, 0.0, 0.3, "iron"))
        return parts + arrow("arrow_in", 0.0, 0.33) + arrow("arrow_out", 0.33 * side, 0.0, 90 * side)
    return build


if __name__ == "__main__":
    models = {
        "packer": packer,
        "conveyor-elbow-left": elbow(1),
        "conveyor-elbow-right": elbow(-1),
        "truck": truck,
        "scanner": scanner,
        "exit": exit_conveyor,
        "strapper": strapper,
        "conveyor-straight": conveyor_straight,
        "conveyor-tee": conveyor_tee,
    }
    export_all(models, P, 1200, HERE, center=False, ground=False)
