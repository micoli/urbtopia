import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall, wall_variants  # noqa: E402

P = lpm.Palette([
    ("glass", "#cfeefa", 0.0, 0.2),
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("yellow", "#f4c430", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("blue", "#2f7de1", 0.0, 0.5), ("orange", "#f28c28", 0.0, 0.5),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9),
    ("brick", "#b5523b", 0.0, 0.95), ("brick_light", "#c9674d", 0.0, 0.95), ("brick_dark", "#8b3b2a", 0.0, 0.95),
    ("wool", "#efe6d2", 0.0, 0.95), ("alpaca", "#a8764a", 0.0, 0.95), ("silk", "#e7a9c4", 0.0, 0.6), ("yarn", "#d9c9a3", 0.0, 0.95),
])

PIPE_Z = 0.34


def horizontal(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +y, then move it."""
    lpm.rotate(ob, -90, axis="X")
    lpm.move(ob, x, y, z)
    return ob


def bobbin(name, x, y, z, color, height=0.22):
    """A spool of fibre: a coloured body between two iron flanges, standing on a pin."""
    return [disc(f"{name}_pin", 0.015, height + 0.04, (x, y, z), P["steel_dark"], 6),
            disc(f"{name}_foot", 0.06, 0.02, (x, y, z), P["iron"], 8),
            disc(f"{name}_body", 0.05, height - 0.04, (x, y, z + 0.02), P[color], 8),
            disc(f"{name}_head", 0.06, 0.02, (x, y, z + height - 0.02), P["iron"], 8)]


def spinner(rng):
    """Spinner facing -y: the drive comes in through the blue stub at the front and turns the carousel of full bobbins on the table. The fibre comes in from the creel at the back,
    marked by the green box, and the spun yarn leaves on the left through the orange guide (on the right in the mirrored one)."""
    parts = [block("plinth", -0.42, 0.42, -0.42, 0.42, 0.0, 0.1, P["wood_dark"]),
             block("cabinet", -0.38, 0.38, -0.3, 0.3, 0.1, 0.4, P["iron"]), block("cabinet_band", -0.39, 0.39, -0.31, 0.31, 0.24, 0.28, P["steel_dark"]),
             block("table", -0.4, 0.4, -0.32, 0.32, 0.4, 0.44, P["steel"]),
             block("gearbox", -0.12, 0.12, -0.4, -0.3, 0.14, 0.38, P["iron"]), block("lamp", -0.04, 0.04, -0.41, -0.38, 0.34, 0.4, P["yellow"]),
             disc("axle", 0.04, 0.3, (0, 0, 0.44), P["steel_dark"], 8),
             block("post_a", -0.32, -0.28, 0.26, 0.3, 0.44, 0.96, P["wood_dark"]), block("post_b", 0.28, 0.32, 0.26, 0.3, 0.44, 0.96, P["wood_dark"]),
             block("shelf", -0.34, 0.34, 0.22, 0.34, 0.6, 0.64, P["wood"]), block("rail", -0.34, 0.34, 0.26, 0.3, 0.92, 0.96, P["wood_dark"]),
             block("fibre_box", -0.1, 0.1, 0.34, 0.44, 0.26, 0.42, P["iron"]), block("fibre_flag", -0.1, 0.1, 0.4, 0.44, 0.38, 0.46, P["green"]),
             block("guide_post", -0.5, -0.42, -0.06, 0.06, 0.1, 0.46, P["iron"]), block("guide_box", -0.52, -0.4, -0.1, 0.1, 0.4, 0.5, P["orange"]),
             disc("guide_eye", 0.03, 0.14, (-0.46, 0, 0.5), P["brass"], 6)]
    for k, (x, color) in enumerate(((-0.22, "wool"), (0.0, "alpaca"), (0.22, "silk"))):
        parts += bobbin(f"creel{k}", x, 0.28, 0.64, color, 0.28)
    carousel = [disc("turntable", 0.3, 0.03, (0, 0, 0.5), P["steel_dark"], 16), disc("hub", 0.07, 0.1, (0, 0, 0.53), P["iron"], 8)]
    for k, (x, y, color) in enumerate(((0.19, 0.0, "wool"), (0.0, 0.19, "alpaca"), (-0.19, 0.0, "silk"), (0.0, -0.19, "yarn"))):
        carousel += bobbin(f"spool{k}", x, y, 0.53, color, 0.26)
    stub = [horizontal(disc("input", 0.045, 0.22, (0, 0, 0), P["blue"], 6), y=-0.5, z=PIPE_Z),
            horizontal(disc("input_collar", 0.07, 0.05, (0, 0, 0), P["blue"], 6), y=-0.5, z=PIPE_Z),
            block("input_key", -0.012, 0.012, -0.5, -0.4, 0.375, 0.395, P["steel_dark"])]
    return parts, {"spin-up": (carousel, (0, 0, 0.5)), "spin-y": (stub, (0, 0, PIPE_Z))}


def mirrored(builder):
    """The model a builder draws, turned into its mirror image across the x = 0 plane, with the pivots of its moving parts."""
    def build(rng):
        parts, spinners = builder(rng)
        flipped = {name: ([lpm.scale(part, sx=-1) for part in group], (-pivot[0], pivot[1], pivot[2])) for name, (group, pivot) in spinners.items()}
        return [lpm.scale(part, sx=-1) for part in parts], flipped
    return build


def parquet_floor(rng):
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


def brick_wall(rng):
    return half_height(thick_wall(P, "brick", "wood_dark", "brick_dark", "wood"))


def brick_partition(rng):
    return half_height(partition_wall(P, "brick", "wood_dark", "brick_dark", "wood"))


def brick_junction(arms):
    return lambda rng: half_height(junction_wall(P, "brick", "wood_dark", "brick_dark", "wood", arms))


def brick_corner(rng):
    return half_height(thick_corner(P, "brick", "wood_dark", "brick_dark", "wood"))


def wall_set():
    return {"floor": parquet_floor, "wall": brick_wall, "partition": brick_partition, "partition-elbow": brick_junction("ES"), "partition-tee": brick_junction("WES"),
            "partition-cross": brick_junction("ESWN"), "wall-corner": brick_corner, **wall_variants(P, "brick", "wood_dark", "brick_dark", "wood", "half")}


if __name__ == "__main__":
    models = {"spinner": spinner, "spinner-right": mirrored(spinner)}
    walls = wall_set()
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(walls, P, 900, HERE, center=False, ground=False)
