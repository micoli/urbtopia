import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, disc  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("white", "#f6f2ea", 0.0, 0.9), ("glass", "#cfeefa", 0.0, 0.2), ("belt", "#33363f", 0.0, 0.9),
    ("teal", "#2f9a8a", 0.2, 0.5), ("teal_dark", "#1f6e62", 0.2, 0.5), ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5),
    ("orange", "#e8863a", 0.0, 0.6), ("orange_dark", "#b3601f", 0.0, 0.6), ("flame", "#ff9a2e", 0.0, 0.4, 1.2),
    ("bottle", "#7fc98a", 0.0, 0.3), ("waste", "#9a8f7a", 0.0, 0.9),
    ("brick", "#a8553a", 0.0, 0.9), ("brick_dark", "#7a3a26", 0.0, 0.9), ("ash", "#5a5560", 0.0, 0.8),
])

# Height of the top of a Conveyor belt, and of the axis of the Drive: every Machine and every Conveyor meet at BELT_Z.
BELT_Z = 0.42
DRIVE_Z = 0.34
DRUM_Z = 1.02


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


def arrow(name, x, y, turn=0, color="yellow", size=0.09):
    """A flat arrow on the belt that points toward -y (turn 0) or toward +y (turn 180)."""
    head = lpm.prism(f"{name}_head", 3, size, 0.004, at=(0, 0, BELT_Z - 0.02), color=P[color])
    lpm.rotate(head, 30 + turn, axis="Z")
    lpm.move(head, x, y, 0)
    if turn == 180:
        tail = block(f"{name}_tail", x - size * 0.22, x + size * 0.22, y - size * 1.0, y - size * 0.3, BELT_Z - 0.02, BELT_Z - 0.016, P[color])
    else:
        tail = block(f"{name}_tail", x - size * 0.22, x + size * 0.22, y + size * 0.3, y + size * 1.0, BELT_Z - 0.02, BELT_Z - 0.016, P[color])
    return [head, tail]


def conveyor_straight():
    """Straight belt toward -y, from edge to edge of its tile: two steel rails and a black belt at BELT_Z, two legs at each end."""
    parts = [block("belt_rail_l", -0.2, -0.17, -0.5, 0.5, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -0.5, 0.5, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -0.5, 0.5, 0.3, BELT_Z - 0.02, P["belt"])]
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]),
                  block(f"brace{k}", -0.2, 0.2, y - 0.02, y + 0.02, 0.12, 0.15, P["iron"])]
    return parts + arrow("arrow", 0.0, 0.0)


def drive_stub(y=0.0):
    """Gearbox and shaft stub on the right side that bring the Drive in, and the pulley that turns on the axis of the Shafts."""
    parts = [block("gearbox", 0.3, 0.4, y - 0.1, y + 0.1, 0.26, 0.46, P["iron"]), block("gearbox_cap", 0.3, 0.4, y - 0.11, y + 0.11, 0.44, 0.48, P["steel_dark"]),
             sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=y, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=y, z=DRIVE_Z),
              sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=y, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, y - 0.09, y + 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    return parts, pulley


def sorter(rng):
    """Sorter that a Recycling line passes through, along y: the belt of a straight Conveyor runs through a teal tunnel; on its roof a perforated drum turns and a magnet bar hangs
    over the belt, and two chutes on the sides drop what is rejected into a blue bin. The Waste comes in at +y and leaves toward -y. A gearbox on the right brings the Drive in."""
    parts = conveyor_straight()
    parts += [block("post_l", -0.3, -0.2, -0.25, 0.25, 0.3, 0.7, P["teal"]), block("post_r", 0.2, 0.3, -0.25, 0.25, 0.3, 0.7, P["teal"]),
              block("foot_l", -0.32, -0.2, -0.27, 0.27, 0.26, 0.32, P["teal_dark"]), block("foot_r", 0.2, 0.32, -0.27, 0.27, 0.26, 0.32, P["teal_dark"]),
              block("roof", -0.32, 0.32, -0.27, 0.27, 0.7, 0.8, P["teal"]), block("roof_band", -0.33, 0.33, -0.28, 0.28, 0.7, 0.74, P["teal_dark"]),
              block("magnet_l", -0.15, -0.1, -0.2, 0.2, 0.58, 0.7, P["red"]), block("magnet_r", 0.1, 0.15, -0.2, 0.2, 0.58, 0.7, P["red"]),
              block("magnet_bar", -0.15, 0.15, -0.2, 0.2, 0.56, 0.6, P["steel_dark"]),
              block("chute_l", -0.46, -0.3, -0.18, 0.18, 0.5, 0.54, P["steel"]), block("chute_l_wall", -0.48, -0.44, -0.18, 0.18, 0.3, 0.54, P["steel"]),
              block("bin_l", -0.48, -0.32, -0.2, 0.2, 0.0, 0.34, P["blue"]), block("bin_l_rim", -0.5, -0.3, -0.22, 0.22, 0.32, 0.36, P["blue_dark"]),
              block("hopper", -0.22, 0.22, -0.2, 0.2, 0.8, 0.9, P["steel_dark"]),
              block("lamp_stem", -0.26, -0.22, 0.0, 0.04, 0.8, 0.84, P["steel_dark"]), block("lamp", -0.27, -0.21, -0.01, 0.05, 0.84, 0.9, P["green"]),
              block("panel", 0.3, 0.32, -0.2, -0.04, 0.56, 0.68, P["iron"]), block("screen", 0.32, 0.325, -0.18, -0.06, 0.58, 0.66, P["glass"]),
              block("bin_waste", -0.46, -0.34, -0.12, 0.12, 0.34, 0.4, P["waste"]),
              block("drum_cradle_l", -0.2, -0.16, -0.22, 0.22, 0.9, DRUM_Z - 0.1, P["iron"]), block("drum_cradle_r", 0.16, 0.2, -0.22, 0.22, 0.9, DRUM_Z - 0.1, P["iron"])]
    stub, pulley = drive_stub()
    parts += stub
    drum = [horizontal(disc("drum", 0.15, 0.4, (0, 0, 0), P["teal"], 10), x=0.0, y=-0.2, z=DRUM_Z),
            horizontal(disc("drum_ring_a", 0.165, 0.04, (0, 0, 0), P["teal_dark"], 10), x=0.0, y=-0.2, z=DRUM_Z),
            horizontal(disc("drum_ring_b", 0.165, 0.04, (0, 0, 0), P["teal_dark"], 10), x=0.0, y=0.16, z=DRUM_Z),
            block("drum_vane_h", -0.17, 0.17, -0.18, 0.18, DRUM_Z - 0.012, DRUM_Z + 0.012, P["steel_dark"]),
            block("drum_vane_v", -0.012, 0.012, -0.18, 0.18, DRUM_Z - 0.17, DRUM_Z + 0.17, P["steel_dark"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-y": (drum, (0.0, 0.0, DRUM_Z))}


ROTOR_Z = 0.96


def shredder(rng):
    """Shredder that a Recycling line passes through, along y: the belt of a straight Conveyor runs through an orange body; on its roof an open hopper shows a toothed rotor that turns,
    and a red emergency button and hazard stripes mark the front. The Waste comes in at +y and leaves toward -y. A gearbox on the right brings the Drive in."""
    parts = conveyor_straight()
    parts += [block("post_l", -0.3, -0.2, -0.25, 0.25, 0.3, 0.66, P["orange"]), block("post_r", 0.2, 0.3, -0.25, 0.25, 0.3, 0.66, P["orange"]),
              block("foot_l", -0.32, -0.2, -0.27, 0.27, 0.26, 0.32, P["orange_dark"]), block("foot_r", 0.2, 0.32, -0.27, 0.27, 0.26, 0.32, P["orange_dark"]),
              block("body", -0.32, 0.32, -0.27, 0.27, 0.66, 0.84, P["orange"]), block("body_band", -0.33, 0.33, -0.28, 0.28, 0.66, 0.7, P["orange_dark"]),
              block("hopper_l", -0.3, -0.24, -0.25, 0.25, 0.84, 1.1, P["steel_dark"]), block("hopper_r", 0.24, 0.3, -0.25, 0.25, 0.84, 1.1, P["steel_dark"]),
              block("hopper_back", -0.3, 0.3, 0.2, 0.25, 0.84, 1.1, P["steel_dark"]), block("hopper_front", -0.3, 0.3, -0.25, -0.2, 0.84, 1.1, P["steel_dark"]),
              block("lip_l", -0.34, -0.24, -0.29, 0.29, 1.08, 1.12, P["steel"]), block("lip_r", 0.24, 0.34, -0.29, 0.29, 1.08, 1.12, P["steel"]),
              block("lip_back", -0.24, 0.24, 0.2, 0.29, 1.08, 1.12, P["steel"]), block("lip_front", -0.24, 0.24, -0.29, -0.2, 1.08, 1.12, P["steel"]),
              block("rotor_bearing_l", -0.24, -0.2, -0.04, 0.04, 0.84, ROTOR_Z + 0.02, P["iron"]), block("rotor_bearing_r", 0.2, 0.24, -0.04, 0.04, 0.84, ROTOR_Z + 0.02, P["iron"]),
              block("scrap", -0.14, 0.14, -0.14, 0.14, 0.84, 0.86, P["waste"]),
              block("button_stem", -0.3, -0.26, -0.29, -0.27, 0.72, 0.8, P["iron"]), block("button", -0.31, -0.25, -0.31, -0.27, 0.78, 0.82, P["red"]),
              block("panel", 0.32, 0.34, -0.2, -0.04, 0.7, 0.82, P["iron"]), block("screen", 0.34, 0.345, -0.18, -0.06, 0.72, 0.8, P["glass"])]
    parts += [block(f"hazard{k}", -0.3 + 0.1 * k, -0.3 + 0.1 * k + 0.05, -0.285, -0.28, 0.4, 0.5, P["yellow" if k % 2 == 0 else "black"]) for k in range(6)]
    stub, pulley = drive_stub()
    parts += stub
    rotor = [horizontal(disc("rotor", 0.07, 0.4, (0, 0, 0), P["iron"], 8), x=0.0, y=-0.2, z=ROTOR_Z)]
    for k in range(4):
        y = -0.15 + 0.1 * k
        rotor += [block(f"tooth_h{k}", -0.17, 0.17, y, y + 0.04, ROTOR_Z - 0.02, ROTOR_Z + 0.02, P["steel"]),
                  block(f"tooth_v{k}", -0.02, 0.02, y + 0.05, y + 0.09, ROTOR_Z - 0.16, ROTOR_Z + 0.16, P["steel"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-y": (rotor, (0.0, 0.0, ROTOR_Z))}


CHIMNEY_Z = 1.3


def furnace(rng):
    """Smelting furnace that a Recycling line passes through, along y: the belt of a straight Conveyor runs under a brick furnace; its front shows a glowing mouth, a spout pours
    a thread of molten metal onto the belt and a chimney on the roof carries a vent that turns. The Waste comes in at +y and leaves toward -y. A gearbox on the right brings the Drive in."""
    parts = conveyor_straight()
    parts += [block("post_l", -0.3, -0.2, -0.25, 0.25, 0.3, 0.64, P["brick_dark"]), block("post_r", 0.2, 0.3, -0.25, 0.25, 0.3, 0.64, P["brick_dark"]),
              block("foot_l", -0.32, -0.2, -0.27, 0.27, 0.26, 0.32, P["iron"]), block("foot_r", 0.2, 0.32, -0.27, 0.27, 0.26, 0.32, P["iron"]),
              block("body", -0.32, 0.32, -0.27, 0.27, 0.64, 1.0, P["brick"]), block("body_band_low", -0.33, 0.33, -0.28, 0.28, 0.64, 0.7, P["iron"]),
              block("body_band_high", -0.33, 0.33, -0.28, 0.28, 0.94, 1.0, P["iron"]),
              block("mouth_frame", -0.18, 0.18, -0.285, -0.27, 0.72, 0.92, P["iron"]), block("mouth", -0.15, 0.15, -0.29, -0.285, 0.75, 0.89, P["flame"]),
              block("mouth_slit", -0.15, 0.15, -0.292, -0.289, 0.81, 0.83, P["yellow"]),
              block("chimney", -0.1, 0.1, -0.1, 0.1, 1.0, CHIMNEY_Z - 0.04, P["ash"]), block("chimney_ring", -0.12, 0.12, -0.12, 0.12, CHIMNEY_Z - 0.06, CHIMNEY_Z - 0.02, P["iron"]),
              block("spout_arm", -0.04, 0.04, -0.12, 0.0, 0.56, 0.64, P["iron"]), block("spout", -0.05, 0.05, -0.16, -0.1, 0.5, 0.64, P["iron"]),
              block("stream", -0.015, 0.015, -0.14, -0.12, BELT_Z, 0.52, P["flame"]), block("puddle", -0.07, 0.07, -0.19, -0.07, BELT_Z - 0.02, BELT_Z + 0.01, P["orange"]),
              block("panel", 0.32, 0.34, -0.2, -0.04, 0.72, 0.9, P["iron"]), block("screen", 0.34, 0.345, -0.18, -0.06, 0.76, 0.86, P["flame"]),
              block("pipe_l", -0.36, -0.32, -0.2, 0.2, 0.7, 0.76, P["steel_dark"]), block("pipe_up", -0.36, -0.32, -0.2, -0.16, 0.76, 0.94, P["steel_dark"])]
    stub, pulley = drive_stub()
    parts += stub
    vent = [block("vent_hub", -0.03, 0.03, -0.03, 0.03, CHIMNEY_Z - 0.02, CHIMNEY_Z + 0.08, P["steel_dark"]),
            block("vent_blade_a", -0.16, 0.16, -0.025, 0.025, CHIMNEY_Z + 0.02, CHIMNEY_Z + 0.05, P["steel"]),
            block("vent_blade_b", -0.025, 0.025, -0.16, 0.16, CHIMNEY_Z + 0.02, CHIMNEY_Z + 0.05, P["steel"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-up": (vent, (0.0, 0.0, CHIMNEY_Z + 0.03))}


PAN_Z = 0.88


def crusher(rng):
    """Glass crusher that a Recycling line passes through, along y: the belt of a straight Conveyor runs under a blue body; on its roof a round pan under a glass cover holds green
    bottles that a turning plate with paddles grinds, a chute pours the green cullet onto the belt and a hopper on the back feeds the pan. The Waste comes in at +y and leaves
    toward -y. A gearbox on the right brings the Drive in."""
    parts = conveyor_straight()
    parts += [block("post_l", -0.3, -0.2, -0.25, 0.25, 0.3, 0.64, P["blue"]), block("post_r", 0.2, 0.3, -0.25, 0.25, 0.3, 0.64, P["blue"]),
              block("foot_l", -0.32, -0.2, -0.27, 0.27, 0.26, 0.32, P["blue_dark"]), block("foot_r", 0.2, 0.32, -0.27, 0.27, 0.26, 0.32, P["blue_dark"]),
              block("body", -0.32, 0.32, -0.27, 0.27, 0.64, 0.82, P["blue"]), block("body_band", -0.33, 0.33, -0.28, 0.28, 0.64, 0.68, P["blue_dark"]),
              disc("pan_wall", 0.28, 0.18, (0.0, 0.0, 0.82), P["steel_dark"], 12), disc("pan_rim", 0.3, 0.03, (0.0, 0.0, 0.97), P["steel"], 12),
              disc("pan_floor", 0.25, 0.01, (0.0, 0.0, 0.99), P["iron"], 12),
              disc("cover", 0.27, 0.02, (0.0, 0.0, 1.2), P["glass"], 12),
              block("cover_post_a", -0.26, -0.23, -0.03, 0.03, 1.0, 1.2, P["steel"]), block("cover_post_b", 0.23, 0.26, -0.03, 0.03, 1.0, 1.2, P["steel"]),
              block("cover_post_c", -0.03, 0.03, -0.26, -0.23, 1.0, 1.2, P["steel"]), block("cover_post_d", -0.03, 0.03, 0.23, 0.26, 1.0, 1.2, P["steel"]),
              block("hopper_stem", -0.1, 0.1, 0.26, 0.38, 0.82, 1.0, P["blue_dark"]), block("hopper", -0.18, 0.18, 0.3, 0.5, 0.98, 1.1, P["steel_dark"]),
              block("hopper_lip", -0.2, 0.2, 0.28, 0.52, 1.08, 1.12, P["steel"]), block("hopper_glass", -0.14, 0.14, 0.32, 0.48, 1.09, 1.1, P["bottle"]),
              block("chute", -0.06, 0.06, -0.3, -0.18, 0.52, 0.84, P["steel"]), block("chute_mouth", -0.09, 0.09, -0.32, -0.16, 0.5, 0.56, P["steel_dark"]),
              block("cullet_a", -0.1, -0.02, -0.28, -0.18, BELT_Z, BELT_Z + 0.04, P["bottle"]), block("cullet_b", 0.0, 0.08, -0.3, -0.2, BELT_Z, BELT_Z + 0.07, P["bottle"]),
              block("cullet_c", -0.05, 0.03, -0.24, -0.16, BELT_Z + 0.04, BELT_Z + 0.08, P["bottle"]),
              block("panel", 0.32, 0.34, -0.2, -0.04, 0.68, 0.8, P["iron"]), block("screen", 0.34, 0.345, -0.18, -0.06, 0.7, 0.78, P["bottle"])]
    stub, pulley = drive_stub()
    parts += stub
    plate = [disc("plate", 0.22, 0.03, (0.0, 0.0, PAN_Z + 0.12), P["steel"], 12), disc("plate_hub", 0.05, 0.1, (0.0, 0.0, PAN_Z + 0.12), P["steel_dark"], 8),
             block("paddle_a", -0.2, 0.2, -0.03, 0.03, PAN_Z + 0.15, PAN_Z + 0.25, P["iron"]), block("paddle_b", -0.03, 0.03, -0.2, 0.2, PAN_Z + 0.15, PAN_Z + 0.25, P["iron"]),
            block("shard_a", 0.1, 0.18, 0.04, 0.12, PAN_Z + 0.15, PAN_Z + 0.2, P["bottle"]), block("shard_b", -0.18, -0.1, -0.12, -0.04, PAN_Z + 0.15, PAN_Z + 0.2, P["bottle"]),
            block("shard_c", -0.12, -0.06, 0.08, 0.14, PAN_Z + 0.15, PAN_Z + 0.19, P["glass"]), block("shard_d", 0.06, 0.12, -0.16, -0.1, PAN_Z + 0.15, PAN_Z + 0.19, P["glass"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "spin-up": (plate, (0.0, 0.0, PAN_Z + 0.12))}


def shifted(parts, dy):
    """Move parts along y: a part drawn against a wall at y 0 is moved so that its back lies on the back edge of its tile (y 0.5)."""
    for part in parts:
        lpm.move(part, 0, dy, 0)
    return parts


def intake(rng):
    """Intake standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a deep teal cabinet with a wide
    hopper heaped with Waste on top, a mouth that pushes the Waste onto the belt at BELT_Z, which ends on the front edge of the tile where the first Conveyor of the line begins.
    The cabinet reaches the middle of the tile so that the shaft stub that brings the Drive in sticks out of its right side on the axis of the Shafts."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.8, P["teal"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["teal_dark"]),
             block("body_top", -0.41, 0.41, front - 0.01, 0.0, 0.78, 0.82, P["teal_dark"]),
             block("hopper_l", -0.38, -0.34, -0.55, -0.05, 0.82, 1.1, P["steel_dark"]), block("hopper_r", 0.34, 0.38, -0.55, -0.05, 0.82, 1.1, P["steel_dark"]),
             block("hopper_back", -0.38, 0.38, -0.09, -0.05, 0.82, 1.1, P["steel_dark"]), block("hopper_front", -0.38, 0.38, -0.55, -0.51, 0.82, 1.0, P["steel_dark"]),
             block("hopper_lip", -0.4, 0.4, -0.09, -0.05, 1.08, 1.12, P["steel"]), block("hopper_lip_l", -0.4, -0.34, -0.57, -0.03, 1.08, 1.12, P["steel"]),
             block("hopper_lip_r", 0.34, 0.4, -0.57, -0.03, 1.08, 1.12, P["steel"]),
             block("heap_a", -0.3, 0.0, -0.46, -0.16, 0.82, 1.0, P["waste"]), block("heap_b", 0.0, 0.3, -0.42, -0.12, 0.82, 1.06, P["waste"]),
             block("bag", -0.22, -0.04, -0.4, -0.2, 1.0, 1.12, P["white"]), block("bottle", 0.08, 0.2, -0.36, -0.24, 1.06, 1.16, P["bottle"]),
             block("tin", -0.12, 0.0, -0.3, -0.18, 0.98, 1.08, P["steel"]),
             block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.6, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.6, 0.64, P["steel_dark"]),
             block("mouth_frame_l", -0.22, -0.2, front - 0.02, front, 0.36, 0.6, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, front - 0.02, front, 0.36, 0.6, P["steel_dark"]),
             block("panel", 0.0, 0.34, front - 0.015, front, 0.66, 0.76, P["iron"]), block("screen", 0.03, 0.2, front - 0.02, front - 0.015, 0.68, 0.74, P["glass"]),
             block("button_red", 0.24, 0.28, front - 0.02, front - 0.015, 0.68, 0.72, P["red"]), block("button_green", 0.29, 0.33, front - 0.02, front - 0.015, 0.68, 0.72, P["green"]),
             block("hazard_l", -0.38, -0.3, front - 0.015, front, 0.7, 0.76, P["yellow"]), block("hazard_r", -0.28, -0.2, front - 0.015, front, 0.7, 0.76, P["black"]),
             block("belt_rail_l", -0.2, -0.17, -1.0, front, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -1.0, front, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -1.0, front, 0.3, 0.4, P["belt"]),
             block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"]),
             block("gearbox", 0.4, 0.46, -0.58, -0.42, 0.26, 0.42, P["iron"]),
             sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=-0.5, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=-0.5, z=DRIVE_Z),
              sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=-0.5, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.5 - 0.09, -0.5 + 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    pusher = [block("pusher_plate", -0.14, 0.14, -0.36, -0.24, 1.18, 1.21, P["steel"]), block("pusher_rod", -0.03, 0.03, -0.32, -0.28, 1.21, 1.31, P["steel_dark"]),
              block("pusher_knob", -0.06, 0.06, -0.34, -0.26, 1.31, 1.35, P["yellow"])]
    return shifted(parts, 0.5), {"spin-x": (shifted(pulley, 0.5), (0.46, 0.0, DRIVE_Z)), "slide-up": (shifted(pusher, 0.5), (0, 0, 0))}


def collection_exit(rng):
    """Collection exit standing against a wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): the belt comes in from the room
    at BELT_Z, goes through a hatch of the wall under a rubber curtain and ends outside on a roller, where the truck takes the Waste. The Waste travels toward +y. A lamp on the
    hatch lights when the line is complete."""
    parts = [block("belt_rail_l", -0.2, -0.17, -1.0, 0.32, 0.3, BELT_Z, P["steel"]), block("belt_rail_r", 0.17, 0.2, -1.0, 0.32, 0.3, BELT_Z, P["steel"]),
             block("belt_bed", -0.17, 0.17, -1.0, 0.32, 0.3, BELT_Z - 0.02, P["belt"])]
    parts += [sideways(disc("end_roller", 0.04, 0.34, (0, 0, 0), P["steel_dark"], 8), x=-0.17, y=0.32, z=BELT_Z - 0.04)]
    for k, y in enumerate((-0.92, -0.5, -0.14, 0.26)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("hatch_l", -0.3, -0.22, -0.06, 0.04, 0.3, 0.72, P["teal_dark"]), block("hatch_r", 0.22, 0.3, -0.06, 0.04, 0.3, 0.72, P["teal_dark"]),
              block("hatch_top", -0.3, 0.3, -0.06, 0.04, 0.6, 0.72, P["teal_dark"]), block("hatch_cap", -0.32, 0.32, -0.07, 0.05, 0.7, 0.74, P["teal"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.74, 0.78, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.78, 0.84, P["green"])]
    parts += [block(f"hazard{k}", -0.28 + 0.1 * k, -0.28 + 0.1 * k + 0.05, -0.07, -0.065, 0.62, 0.68, P["yellow" if k % 2 == 0 else "black"]) for k in range(6)]
    parts += [block(f"curtain{k}", -0.22 + 0.088 * k, -0.22 + 0.088 * k + 0.08, -0.03, -0.01, 0.46, 0.6, P["belt"]) for k in range(5)]
    return shifted(parts + arrow("arrow", 0.0, -0.8, 180), 0.5)


def packet(name, x0, x1, y0, y1, z0, z1):
    """A box-shaped heap of Waste closed by a white strip along its top."""
    middle = (x0 + x1) / 2
    return [block(name, x0, x1, y0, y1, z0, z1, P["waste"]), block(f"{name}_tape", middle - 0.015, middle + 0.015, y0, y1, z1, z1 + 0.004, P["white"])]


def truck(rng):
    """Delivery truck in the frame of an Exit, parked outside its wall: the open back of the cargo box faces the wall (toward -y) at y 0.86, its floor at BELT_Z, level with
    the roller of the Exit, and the cab points toward +y. It only drives in and out of the picture."""
    parts = [block("chassis", -0.2, 0.2, 0.36, 1.3, 0.2, 0.28, P["iron"]),
             block("cargo_floor", -0.25, 0.25, 0.36, 0.9, 0.28, 0.4, P["teal_dark"]),
             block("cargo_wall_l", -0.25, -0.22, 0.36, 0.9, 0.4, 0.78, P["teal"]), block("cargo_wall_r", 0.22, 0.25, 0.36, 0.9, 0.4, 0.78, P["teal"]),
             block("cargo_front", -0.25, 0.25, 0.87, 0.9, 0.4, 0.78, P["teal"]), block("cargo_roof", -0.26, 0.26, 0.35, 0.91, 0.78, 0.82, P["teal_dark"]),
             block("cargo_band_l", -0.26, -0.25, 0.36, 0.9, 0.5, 0.56, P["yellow"]), block("cargo_band_r", 0.25, 0.26, 0.36, 0.9, 0.5, 0.56, P["yellow"]),
             block("bumper", -0.24, 0.24, 0.32, 0.36, 0.2, 0.3, P["steel_dark"]),
             block("light_l", -0.22, -0.16, 0.355, 0.365, 0.46, 0.52, P["red"]), block("light_r", 0.16, 0.22, 0.355, 0.365, 0.46, 0.52, P["red"]),
             block("cab", -0.24, 0.24, 0.92, 1.24, 0.28, 0.74, P["white"]), block("cab_roof", -0.25, 0.25, 0.91, 1.25, 0.72, 0.76, P["teal_dark"]),
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


def mirrored(builder):
    """The model a builder draws, turned into its mirror image across the x = 0 plane, with the pivots of its moving parts."""
    def build(rng):
        parts, spinners = builder(rng)
        flipped = {name: ([lpm.scale(part, sx=-1) for part in group], (-pivot[0], pivot[1], pivot[2])) for name, (group, pivot) in spinners.items()}
        return [lpm.scale(part, sx=-1) for part in parts], flipped
    return build


if __name__ == "__main__":
    models = {
        "sorter": sorter,
        "sorter-left": mirrored(sorter),
        "shredder": shredder,
        "shredder-left": mirrored(shredder),
        "furnace": furnace,
        "furnace-left": mirrored(furnace),
        "crusher": crusher,
        "crusher-left": mirrored(crusher),
        "intake": intake,
        "intake-left": mirrored(intake),
        "exit": collection_exit,
        "truck": truck,
    }
    export_all(models, P, 1200, HERE, center=False, ground=False)
