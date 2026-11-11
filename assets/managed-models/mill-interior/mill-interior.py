import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("yellow", "#f4c430", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9),
    ("stone", "#b9b4aa", 0.0, 0.95), ("stone_light", "#d3cec3", 0.0, 0.95), ("stone_dark", "#7d786f", 0.0, 0.95),
    ("wheat", "#e8c96a", 0.0, 0.8), ("flour", "#f6f2ea", 0.0, 0.9), ("rope", "#a8845a", 0.0, 0.9),
])

PIPE_Z = 0.34


def horizontal(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +y, then move it."""
    lpm.rotate(ob, -90, axis="X")
    lpm.move(ob, x, y, z)
    return ob


def millstone(rng):
    """Millstone facing -y: the drive comes in through the shaft stub at the front and a gearbox turns the runner stone inside a wooden vat, grain falls from the hopper
    through the eye of the stone, and the flour runs down a spout into a sack on the right."""
    parts = [block("plinth", -0.42, 0.42, -0.42, 0.42, 0.0, 0.1, P["wood_dark"]),
             disc("vat", 0.36, 0.3, (0, 0, 0.1), P["wood"], 16),
             disc("hoop_low", 0.375, 0.03, (0, 0, 0.15), P["iron"], 16), disc("hoop_high", 0.375, 0.03, (0, 0, 0.33), P["iron"], 16),
             disc("bed", 0.33, 0.06, (0, 0, 0.4), P["stone_dark"], 16),
             block("gearbox", -0.12, 0.12, -0.4, -0.28, 0.14, 0.46, P["iron"]),
             block("lamp", -0.04, 0.04, -0.41, -0.38, 0.38, 0.44, P["green"]),
             block("spout", 0.3, 0.46, -0.05, 0.05, 0.24, 0.3, P["wood_light"]), block("spout_lip", 0.44, 0.47, -0.07, 0.07, 0.2, 0.32, P["wood_dark"]),
             block("sack", 0.34, 0.5, -0.12, 0.12, 0.0, 0.2, P["flour"]), block("sack_tie", 0.38, 0.46, -0.05, 0.05, 0.2, 0.24, P["rope"])]
    for k, (x, y) in enumerate(((-0.24, -0.24), (0.24, -0.24), (0.24, 0.24), (-0.24, 0.24))):
        parts.append(block(f"post{k}", x - 0.025, x + 0.025, y - 0.025, y + 0.025, 0.4, 0.96, P["wood_dark"]))
    parts += [lpm.prism("hopper", 4, 0.07, 0.3, at=(0, 0, 0.62), color=P["wood"], radius_top=0.36, rotate=45), lpm.prism("grain", 4, 0.34, 0.02, at=(0, 0, 0.9), color=P["wheat"], rotate=45),
              block("rail_a", -0.27, 0.27, -0.27, -0.21, 0.92, 0.96, P["wood_dark"]), block("rail_b", -0.27, 0.27, 0.21, 0.27, 0.92, 0.96, P["wood_dark"]),
              block("rail_c", -0.27, -0.21, -0.27, 0.27, 0.92, 0.96, P["wood_dark"]), block("rail_d", 0.21, 0.27, -0.27, 0.27, 0.92, 0.96, P["wood_dark"]),
              block("shoe", -0.03, 0.03, -0.12, 0.0, 0.5, 0.58, P["wood_light"])]
    runner = [disc("runner", 0.31, 0.1, (0, 0, 0.46), P["stone_light"], 16), disc("eye", 0.06, 0.012, (0, 0, 0.558), P["black"], 8),
              block("furrow_a", -0.29, 0.29, -0.015, 0.015, 0.556, 0.564, P["stone_dark"]), block("furrow_b", -0.015, 0.015, -0.29, 0.29, 0.556, 0.564, P["stone_dark"])]
    stub = [horizontal(disc("input", 0.045, 0.22, (0, 0, 0), P["steel"], 6), y=-0.5, z=PIPE_Z),
            horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["brass"], 6), y=-0.5, z=PIPE_Z),
            block("input_key", -0.012, 0.012, -0.5, -0.4, 0.375, 0.395, P["steel_dark"])]
    return parts, {"spin-up": (runner, (0, 0, 0.5)), "spin-y": (stub, (0, 0, PIPE_Z))}


def plank_floor(rng):
    """Wooden plank floor tile centred on the origin, like the walls."""
    return checker_floor(P, "wood_light", "wood", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    """The timber band keeps its place on the wall (from 0.3), cut under the cap of the lower wall."""
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def stone_wall(rng):
    return half_height(thick_wall(P, "stone", "wood_dark", "stone_dark", "wood"))


def stone_partition(rng):
    return half_height(partition_wall(P, "stone", "wood_dark", "stone_dark", "wood"))


def stone_junction(arms):
    return lambda rng: half_height(junction_wall(P, "stone", "wood_dark", "stone_dark", "wood", arms))


def stone_corner(rng):
    return half_height(thick_corner(P, "stone", "wood_dark", "stone_dark", "wood"))


def wall_set():
    return {"floor": plank_floor, "wall": stone_wall, "partition": stone_partition, "partition-elbow": stone_junction("ES"), "partition-tee": stone_junction("WES"),
            "partition-cross": stone_junction("ESWN"), "wall-corner": stone_corner}


if __name__ == "__main__":
    models = {"millstone": millstone}
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
