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
    ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5), ("orange", "#e07b2c", 0.2, 0.5), ("orange_dark", "#b45a1a", 0.2, 0.5),
    ("kraft", "#c9a26b", 0.0, 0.9), ("kraft_dark", "#a8814a", 0.0, 0.9), ("tape", "#e9dfc9", 0.0, 0.6), ("slate", "#7f8ea1", 0.0, 0.9),
    ("concrete", "#a3a9b3", 0.0, 0.95), ("concrete_dark", "#8f95a0", 0.0, 0.95), ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9),
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


def crate(name, x0, x1, y0, y1, z0, z1, dark=False):
    return [block(name, x0, x1, y0, y1, z0, z1, P["kraft_dark" if dark else "kraft"]), block(f"{name}_tape", (x0 + x1) / 2 - 0.015, (x0 + x1) / 2 + 0.015, y0, y1, z1, z1 + 0.004, P["tape"])]


def dock_entry(rng):
    """Loading dock standing against the back wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): an orange cabinet with a roller
    door that opens on the yard, a chute that pushes a crate onto the belt at BELT_Z, which ends on the front edge of the tile where the first Conveyor begins. The shaft stub
    that brings the Drive in sticks out of the right side on the axis of the Shafts."""
    front = -0.6
    parts = [block("body", -0.4, 0.4, front, 0.0, 0.26, 0.86, P["orange"]), block("body_band", -0.41, 0.41, front - 0.01, 0.0, 0.26, 0.3, P["orange_dark"]),
             block("body_top", -0.41, 0.41, front - 0.01, 0.0, 0.84, 0.88, P["orange_dark"]),
             block("door_frame", -0.3, 0.3, front - 0.015, front, 0.62, 0.84, P["steel_dark"]), block("door", -0.27, 0.27, front - 0.02, front - 0.015, 0.64, 0.82, P["steel"]),
             block("rib_a", -0.27, 0.27, front - 0.025, front - 0.02, 0.7, 0.72, P["steel_dark"]), block("rib_b", -0.27, 0.27, front - 0.025, front - 0.02, 0.76, 0.78, P["steel_dark"]),
             block("mouth", -0.2, 0.2, front - 0.015, front, 0.36, 0.58, P["black"]), block("mouth_frame_t", -0.22, 0.22, front - 0.02, front, 0.58, 0.62, P["steel_dark"]),
             block("panel", 0.0, 0.34, front - 0.015, front, 0.3, 0.52, P["iron"]), block("button_red", 0.24, 0.28, front - 0.02, front - 0.015, 0.4, 0.46, P["red"]),
             block("button_green", 0.29, 0.33, front - 0.02, front - 0.015, 0.4, 0.46, P["green"]),
             block("lamp_stem", -0.3, -0.26, -0.3, -0.26, 0.88, 0.92, P["steel_dark"]), block("lamp", -0.31, -0.25, -0.31, -0.25, 0.92, 0.98, P["yellow"])]
    parts += crate("first_crate", -0.12, 0.12, front - 0.2, front - 0.04, BELT_Z, BELT_Z + 0.12)
    parts += belt(-1.0, front) + [block("belt_leg_l", -0.2, -0.17, -0.98, -0.92, 0.0, 0.3, P["iron"]), block("belt_leg_r", 0.17, 0.2, -0.98, -0.92, 0.0, 0.3, P["iron"])]
    parts += [block("gearbox", 0.4, 0.46, -0.58, -0.42, 0.26, 0.42, P["iron"]), sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=-0.5, z=DRIVE_Z)]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=-0.5, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=-0.5, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.59, -0.41, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    return shifted(parts, 0.5), {"spin-x": (shifted(pulley, 0.5), (0.46, 0.0, DRIVE_Z))}


def hoist(rng):
    """Hoist that a Line passes through, along y: the belt runs under an orange gantry whose trolley lifts a crate by a hook and sets it down again. A reel of chain turns on the left
    post, and a shaft stub on the right brings the Drive in through a gearbox. The crates come in at +y and leave toward -y."""
    parts = belt(-0.5, 0.5)
    for k, y in enumerate((-0.42, 0.42)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]),
                  block(f"brace{k}", -0.2, 0.2, y - 0.02, y + 0.02, 0.12, 0.15, P["iron"])]
    parts += [block("post_l", -0.3, -0.2, -0.2, 0.2, 0.3, 0.9, P["orange"]), block("post_r", 0.2, 0.3, -0.2, 0.2, 0.3, 0.9, P["orange"]),
              block("foot_l", -0.32, -0.2, -0.22, 0.22, 0.26, 0.32, P["orange_dark"]), block("foot_r", 0.2, 0.32, -0.22, 0.22, 0.26, 0.32, P["orange_dark"]),
              block("beam", -0.32, 0.32, -0.12, 0.12, 0.9, 1.0, P["orange"]), block("beam_cap", -0.33, 0.33, -0.13, 0.13, 0.98, 1.02, P["orange_dark"]),
              block("trolley", -0.1, 0.1, -0.1, 0.1, 0.84, 0.9, P["steel_dark"]),
              block("gearbox", 0.3, 0.4, -0.1, 0.1, 0.26, 0.46, P["iron"]), block("gearbox_cap", 0.3, 0.4, -0.11, 0.11, 0.44, 0.48, P["steel_dark"]),
              sideways(disc("stub", 0.04, 0.12, (0, 0, 0), P["steel"], 6), x=0.4, y=0.0, z=DRIVE_Z),
              block("lamp_stem", 0.22, 0.26, -0.02, 0.02, 1.02, 1.06, P["steel_dark"]), block("lamp", 0.21, 0.27, -0.03, 0.03, 1.06, 1.12, P["green"])]
    parts += crate("crate_a", -0.1, 0.1, -0.08, 0.1, BELT_Z, BELT_Z + 0.12)
    hook = [block("chain", -0.008, 0.008, -0.008, 0.008, 0.66, 0.84, P["steel"]), block("hook", -0.05, 0.05, -0.02, 0.02, 0.62, 0.66, P["black"])]
    pulley = [sideways(disc("pulley", 0.1, 0.04, (0, 0, 0), P["brass"], 10), x=0.46, y=0.0, z=DRIVE_Z), sideways(disc("pulley_hub", 0.05, 0.08, (0, 0, 0), P["steel_dark"], 8), x=0.44, y=0.0, z=DRIVE_Z),
              block("pulley_spoke", 0.46, 0.5, -0.09, 0.09, DRIVE_Z - 0.015, DRIVE_Z + 0.015, P["black"])]
    return parts, {"spin-x": (pulley, (0.46, 0.0, DRIVE_Z)), "slide-up": (hook, (0, 0, 0))}


def rack_exit(rng):
    """Exit standing against a wall of the room, on the tile along it (its back on the back edge of the tile, y 0.5, its face toward -y): the belt comes in from the room at BELT_Z,
    goes through an opening of the wall and ends in a tall rack of shelves, where the stocker puts the crates away. The crates travel toward +y."""
    parts = belt(-1.0, 0.1)
    for k, y in enumerate((-0.92, -0.5, -0.14)):
        parts += [block(f"leg_l{k}", -0.2, -0.17, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"]), block(f"leg_r{k}", 0.17, 0.2, y - 0.03, y + 0.03, 0.0, 0.3, P["iron"])]
    parts += [block("hatch_l", -0.3, -0.22, -0.06, 0.04, 0.3, 0.72, P["orange_dark"]), block("hatch_r", 0.22, 0.3, -0.06, 0.04, 0.3, 0.72, P["orange_dark"]),
              block("hatch_top", -0.3, 0.3, -0.06, 0.04, 0.6, 0.72, P["orange_dark"]), block("hatch_cap", -0.32, 0.32, -0.07, 0.05, 0.7, 0.74, P["orange"]),
              block("lamp_stem", 0.1, 0.14, -0.02, 0.02, 0.74, 0.78, P["steel_dark"]), block("lamp", 0.09, 0.15, -0.03, 0.03, 0.78, 0.84, P["green"])]
    parts += [block(f"curtain{k}", -0.22 + 0.088 * k, -0.22 + 0.088 * k + 0.08, -0.03, -0.01, 0.46, 0.6, P["belt"]) for k in range(5)]
    for k, (x, y) in enumerate(((-0.4, 0.06), (0.4, 0.06), (-0.4, 0.5), (0.4, 0.5))):
        parts.append(block(f"upright{k}", x - 0.025, x + 0.025, y - 0.025 if y < 0.5 else y - 0.05, y + 0.025 if y < 0.5 else y, 0.0, 1.0, P["blue"]))
    for k, z in enumerate((0.24, 0.5, 0.76)):
        parts += [block(f"beam{k}", -0.42, 0.42, 0.04, 0.08, z, z + 0.04, P["orange"]), block(f"beam_b{k}", -0.42, 0.42, 0.46, 0.5, z, z + 0.04, P["orange"]),
                  block(f"deck{k}", -0.4, 0.4, 0.08, 0.46, z + 0.04, z + 0.06, P["wood"])]
        for s, x in enumerate((-0.27, -0.01, 0.25)):
            if k == 0 and s == 1:
                continue
            parts += crate(f"box{k}{s}", x - 0.11, x + 0.11, 0.14, 0.4, z + 0.06, z + 0.06 + (0.14 if (k + s) % 2 else 0.18), dark=(k + s) % 2 == 0)
    return shifted(parts, 0.5), {}


def concrete_floor(rng):
    """Concrete floor tile centred on the origin, like the walls."""
    return checker_floor(P, "concrete", "concrete_dark", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def slate_wall(rng):
    return half_height(thick_wall(P, "slate", "orange", "iron", "steel_dark"))


def slate_partition(rng):
    return half_height(partition_wall(P, "slate", "orange", "iron", "steel_dark"))


def slate_junction(arms):
    return lambda rng: half_height(junction_wall(P, "slate", "orange", "iron", "steel_dark", arms))


def slate_corner(rng):
    return half_height(thick_corner(P, "slate", "orange", "iron", "steel_dark"))


def wall_set():
    return {"floor": concrete_floor, "wall": slate_wall, "partition": slate_partition, "partition-elbow": slate_junction("ES"), "partition-tee": slate_junction("WES"),
            "partition-cross": slate_junction("ESWN"), "wall-corner": slate_corner}


if __name__ == "__main__":
    models = {"dock-entry": dock_entry, "hoist": hoist, "rack-exit": rack_exit}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
