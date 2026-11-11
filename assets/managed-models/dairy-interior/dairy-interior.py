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
    ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5), ("sky", "#9cc7ea", 0.0, 0.8), ("milk", "#fbf8f0", 0.0, 0.7),
    ("copper", "#b87333", 0.6, 0.4), ("cheese", "#f0c04a", 0.0, 0.8), ("cheese_dark", "#c8962a", 0.0, 0.8), ("rind", "#a8692c", 0.0, 0.85),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("tile", "#eef3f6", 0.0, 0.9), ("tile_dark", "#cddae3", 0.0, 0.9),
    ("teal", "#2f9e8f", 0.2, 0.5), ("teal_dark", "#1f6e63", 0.2, 0.5),
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


def flange(x, y, z, name):
    return sideways(disc(name, 0.07, 0.03, (0, 0, 0), P["blue_dark"], 8), x=x, y=y, z=z)


def milk_vat(rng):
    """Milk vat standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): a steel drum on legs with a
    paddle that stirs the milk, a flanged pipe that brings the Flow in through its right side at the height of the pipes, and a filler mouth that pushes a crate of bottles onto the
    belt at BELT_Z, which ends on the front edge of the tile where the first Conveyor begins."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.5, P["blue"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["blue_dark"]),
             disc("drum", 0.3, 0.42, (0.0, -0.24, 0.5), P["steel"], 14), disc("drum_band", 0.315, 0.04, (0.0, -0.24, 0.62), P["steel_dark"], 14), disc("lid", 0.26, 0.04, (0.0, -0.24, 0.92), P["blue_dark"], 14),
             disc("milk_top", 0.24, 0.02, (0.0, -0.24, 0.9), P["milk"], 12), disc("motor_pod", 0.07, 0.1, (0.0, -0.24, 0.96), P["iron"], 8),
             block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.5, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.5, 0.54, P["steel_dark"]),
             block("mouth_frame_l", -0.22, -0.2, front - 0.02, front, 0.36, 0.5, P["steel_dark"]), block("mouth_frame_r", 0.2, 0.22, front - 0.02, front, 0.36, 0.5, P["steel_dark"]),
             block("panel", 0.02, 0.34, front - 0.015, front, 0.58, 0.72, P["iron"]), block("screen", 0.05, 0.22, front - 0.02, front - 0.015, 0.62, 0.7, P["glass"]),
             block("button_red", 0.26, 0.3, front - 0.02, front - 0.015, 0.62, 0.7, P["red"]),
             block("crate", -0.16, 0.16, front - 0.14, front - 0.02, BELT_Z, BELT_Z + 0.06, P["blue_dark"])]
    for k, x in enumerate((-0.1, 0.0, 0.1)):
        parts += [block(f"bottle{k}", x - 0.03, x + 0.03, front - 0.1, front - 0.04, BELT_Z + 0.06, BELT_Z + 0.14, P["milk"]), block(f"cap{k}", x - 0.02, x + 0.02, front - 0.09, front - 0.05, BELT_Z + 0.14, BELT_Z + 0.16, P["blue"])]
    parts += belt(-1.0, front) + [block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    parts += [block("pipe_box", 0.4, 0.46, -0.4, -0.2, 0.26, 0.42, P["iron"]), sideways(disc("inlet", 0.045, 0.16, (0, 0, 0), P["steel"], 8), x=0.34, y=-0.3, z=0.34), flange(0.46, -0.3, 0.34, "inlet_flange")]
    paddle = [block("paddle_a", -0.2, 0.2, -0.26, -0.22, 0.97, 1.0, P["steel"]), block("paddle_b", -0.02, 0.02, -0.46, -0.02, 0.97, 1.0, P["steel"]), disc("paddle_rod", 0.025, 0.1, (0.0, -0.24, 0.9), P["steel_dark"], 6)]
    return shifted(parts, 0.5), {"spin-up": (shifted(paddle, 0.5), (0.0, 0.26, 0.97))}


def pasteurizer(rng):
    """Pasteuriser that a Line passes through, along y: the belt of the crates runs through a white steel tunnel under a copper coil, with a flanged pipe that brings the Flow in
    at the left and a pump wheel on the right that turns while the heat runs. The crates come in at +y and leave toward -y."""
    parts = belt(-0.5, 0.5)
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("wall_l", -0.32, -0.2, -0.3, 0.3, 0.3, 0.78, P["milk"]), block("wall_r", 0.2, 0.32, -0.3, 0.3, 0.3, 0.78, P["milk"]),
              block("roof", -0.34, 0.34, -0.32, 0.32, 0.78, 0.92, P["milk"]), block("roof_stripe", -0.35, 0.35, -0.33, 0.33, 0.78, 0.82, P["blue"]),
              block("base", -0.34, 0.34, -0.32, 0.32, 0.26, 0.32, P["blue_dark"]),
              block("arch_front", -0.2, 0.2, -0.32, -0.3, 0.7, 0.78, P["black"]), block("arch_back", -0.2, 0.2, 0.3, 0.32, 0.7, 0.78, P["black"]),
              block("crate_a", -0.14, 0.14, -0.14, 0.0, BELT_Z, BELT_Z + 0.06, P["blue_dark"]), block("crate_b", -0.14, 0.14, 0.14, 0.28, BELT_Z, BELT_Z + 0.06, P["blue_dark"]),
              disc("coil_a", 0.12, 0.03, (0.0, -0.1, 0.92), P["copper"], 10), disc("coil_b", 0.12, 0.03, (0.0, 0.1, 0.92), P["copper"], 10), disc("coil_c", 0.12, 0.03, (0.0, 0.0, 0.96), P["copper"], 10),
              disc("gauge_stem", 0.02, 0.06, (-0.2, 0.0, 0.92), P["steel"], 6), disc("gauge", 0.06, 0.03, (-0.2, 0.0, 0.98), P["white"], 8), block("needle", -0.21, -0.19, -0.05, 0.0, 1.0, 1.015, P["red"]),
              block("pipe_box", -0.46, -0.32, -0.1, 0.1, 0.26, 0.42, P["iron"]), sideways(disc("inlet", 0.045, 0.16, (0, 0, 0), P["steel"], 8), x=-0.5, y=0.0, z=0.34), flange(-0.5, 0.0, 0.34, "inlet_flange")]
    wheel = [sideways(disc("pump_wheel", 0.1, 0.04, (0, 0, 0), P["teal"], 10), x=0.46, y=0.0, z=0.34), sideways(disc("pump_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=0.0, z=0.34),
             block("pump_spoke", 0.46, 0.5, -0.09, 0.09, 0.325, 0.355, P["black"])]
    parts += [block("pump_post", 0.32, 0.4, -0.04, 0.04, 0.26, 0.4, P["iron"])]
    return parts, {"spin-x": (wheel, (0.46, 0.0, 0.34))}


def cheese_cellar(rng):
    """Cheese cellar that a Line passes through, along y: the belt of the crates runs through a wooden cabinet of shelves heaped with wheels of cheese, with a flanged pipe that brings
    the Flow of the cooling in at the left. A fan turns on the roof. The crates come in at +y and leave toward -y."""
    parts = belt(-0.5, 0.5)
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("side_l", -0.34, -0.2, -0.32, 0.32, 0.3, 0.84, P["wood"]), block("side_r", 0.2, 0.34, -0.32, 0.32, 0.3, 0.84, P["wood"]),
              block("roof", -0.36, 0.36, -0.34, 0.34, 0.84, 0.92, P["wood_dark"]), block("base", -0.36, 0.36, -0.34, 0.34, 0.26, 0.32, P["wood_dark"]),
              block("arch_front", -0.2, 0.2, -0.34, -0.32, 0.64, 0.84, P["wood_dark"]), block("arch_back", -0.2, 0.2, 0.32, 0.34, 0.64, 0.84, P["wood_dark"])]
    for k, z in enumerate((0.46, 0.62, 0.78)):
        for s, x in enumerate((-0.27, 0.27)):
            parts += [block(f"shelf{k}{s}", x - 0.08, x + 0.08, -0.3, 0.3, z - 0.015, z + 0.015, P["wood_dark"])]
            for w, y in enumerate((-0.2, 0.0, 0.2)):
                parts.append(disc(f"wheel{k}{s}{w}", 0.065, 0.06, (x, y, z + 0.015), P["cheese" if (k + s + w) % 2 == 0 else "cheese_dark"], 8))
    parts += [block("crate", -0.14, 0.14, -0.1, 0.1, BELT_Z, BELT_Z + 0.06, P["blue_dark"]),
              block("pipe_box", -0.46, -0.34, -0.1, 0.1, 0.26, 0.42, P["iron"]), sideways(disc("inlet", 0.045, 0.16, (0, 0, 0), P["steel"], 8), x=-0.5, y=0.0, z=0.34), flange(-0.5, 0.0, 0.34, "inlet_flange"),
              disc("fan_stem", 0.02, 0.04, (0.0, 0.0, 0.92), P["iron"], 6)]
    fan = [block("fan_a", -0.12, 0.12, -0.02, 0.02, 0.96, 0.99, P["steel"]), block("fan_b", -0.02, 0.02, -0.12, 0.12, 0.96, 0.99, P["steel"]), disc("fan_hub", 0.035, 0.05, (0, 0, 0.94), P["steel_dark"], 6)]
    return parts, {"spin-up": (fan, (0.0, 0.0, 0.97))}


def dairy_exit(rng):
    """Exit standing against a wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): the belt comes in from the room at
    BELT_Z, goes through a hatch of the wall and ends in a glass display case on the shop side with bottles and wheels of cheese, where the seller serves. The crates travel toward +y."""
    parts = belt(-1.0, 0.1)
    for k, y in enumerate((-0.92, -0.5, -0.14)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("hatch_l", -0.3, -0.22, -0.06, 0.04, 0.3, 0.72, P["blue_dark"]), block("hatch_r", 0.22, 0.3, -0.06, 0.04, 0.3, 0.72, P["blue_dark"]),
              block("hatch_top", -0.3, 0.3, -0.06, 0.04, 0.6, 0.72, P["blue_dark"]), block("hatch_cap", -0.32, 0.32, -0.07, 0.05, 0.7, 0.74, P["blue"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.74, 0.78, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.78, 0.84, P["green"])]
    parts += [block(f"curtain{k}", -0.22 + 0.088 * k, -0.22 + 0.088 * k + 0.08, -0.03, -0.01, 0.46, 0.6, P["belt"]) for k in range(5)]
    parts += [block("case_base", -0.36, 0.36, 0.04, 0.5, 0.0, 0.36, P["milk"]), block("case_stripe", -0.37, 0.37, 0.48, 0.52, 0.0, 0.38, P["blue"]),
              block("case_top", -0.37, 0.37, 0.04, 0.52, 0.36, 0.4, P["blue_dark"]),
              block("case_post_l", -0.36, -0.32, 0.46, 0.5, 0.4, 0.74, P["blue"]), block("case_post_r", 0.32, 0.36, 0.46, 0.5, 0.4, 0.74, P["blue"]),
              block("case_glass", -0.32, 0.32, 0.47, 0.49, 0.4, 0.7, P["glass"]), block("case_roof", -0.37, 0.37, 0.04, 0.52, 0.72, 0.76, P["blue_dark"]),
              disc("cheese_a", 0.08, 0.06, (-0.2, 0.28, 0.4), P["cheese"], 8), disc("cheese_b", 0.08, 0.06, (0.0, 0.28, 0.4), P["cheese_dark"], 8), disc("cheese_c", 0.08, 0.06, (0.2, 0.28, 0.4), P["cheese"], 8),
              block("bottle_a", 0.1, 0.16, 0.12, 0.18, 0.4, 0.5, P["milk"]), block("bottle_b", -0.16, -0.1, 0.12, 0.18, 0.4, 0.5, P["milk"])]
    return shifted(parts, 0.5), {}


def tile_floor(rng):
    """White tile floor centred on the origin, like the walls."""
    return checker_floor(P, "tile", "tile_dark", cells=2)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def white_wall(rng):
    return half_height(thick_wall(P, "milk", "blue", "blue_dark", "steel_dark"))


def white_partition(rng):
    return half_height(partition_wall(P, "milk", "blue", "blue_dark", "steel_dark"))


def white_junction(arms):
    return lambda rng: half_height(junction_wall(P, "milk", "blue", "blue_dark", "steel_dark", arms))


def white_corner(rng):
    return half_height(thick_corner(P, "milk", "blue", "blue_dark", "steel_dark"))


def wall_set():
    return {"floor": tile_floor, "wall": white_wall, "partition": white_partition, "partition-elbow": white_junction("ES"), "partition-tee": white_junction("WES"),
            "partition-cross": white_junction("ESWN"), "wall-corner": white_corner}


if __name__ == "__main__":
    models = {"milk-vat": milk_vat, "pasteurizer": pasteurizer, "cheese-cellar": cheese_cellar, "exit": dairy_exit}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
