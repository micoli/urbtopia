import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("yellow", "#f4c430", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("blue", "#2f7de1", 0.0, 0.5),
    ("orange", "#f28c28", 0.0, 0.5), ("red", "#c4452f", 0.0, 0.6), ("white", "#f3f1ec", 0.0, 0.8),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9),
    ("brick", "#b5533c", 0.0, 0.9), ("brick_dark", "#8c3d2b", 0.0, 0.9), ("concrete", "#bdbcb6", 0.0, 0.95), ("concrete_dark", "#8f8e88", 0.0, 0.95),
    ("ore", "#7d786f", 0.0, 0.95), ("sand", "#e0c98a", 0.0, 0.9),
])

PIPE_Z = 0.34


def horizontal(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +y, then move it."""
    lpm.rotate(ob, -90, axis="X")
    lpm.move(ob, x, y, z)
    return ob


def sideways(ob, x=0.0, y=0.0, z=0.0):
    """Lay a part built upright along Z down along +x, then move it."""
    lpm.rotate(ob, 90, axis="Y")
    lpm.move(ob, x, y, z)
    return ob


def flange(name, collar, x=0.0, y=0.0, along="y"):
    """A ring that marks the mouth of a pipe."""
    ring = disc(name, 0.08, 0.04, (0, 0, 0), collar, 8)
    return sideways(ring, x=x, y=y, z=PIPE_Z) if along == "x" else horizontal(ring, x=x, y=y, z=PIPE_Z)


def pneumatic_inlet(prefix):
    """The pipe of the pneumatic feed, coming in through the left side at x = -0.5, with its green flange and its iron box."""
    return [sideways(disc(f"{prefix}_pipe", 0.055, 0.24, (0, 0, 0), P["green"], 8), x=-0.5, z=PIPE_Z), flange(f"{prefix}_flange", P["green"], x=-0.5, along="x"),
            block(f"{prefix}_box", -0.4, -0.3, -0.1, 0.1, 0.26, 0.42, P["iron"])]


def belt_stub(prefix, y0, y1):
    """A short length of line belt between y0 and y1, so that the machine reads as part of the line."""
    return [block(f"{prefix}_belt", -0.1, 0.1, y0, y1, 0.14, 0.2, P["black"]), block(f"{prefix}_rail_a", -0.12, -0.1, y0, y1, 0.14, 0.26, P["steel_dark"]),
            block(f"{prefix}_rail_b", 0.1, 0.12, y0, y1, 0.14, 0.26, P["steel_dark"])]


def extractor(rng):
    """Extractor facing -y, standing against the back wall (y = 0.5): a hatch in the wall takes in what comes from outside, a cyclone sucks it up and a chute drops it on the
    line at the front. The pneumatic feed comes in on the left in green; a yellow fan turns on top while it works."""
    parts = [block("plinth", -0.42, 0.42, -0.42, 0.42, 0.0, 0.1, P["concrete_dark"]),
             block("hatch_frame", -0.26, 0.26, 0.4, 0.5, 0.14, 0.7, P["iron"]), block("hatch", -0.2, 0.2, 0.39, 0.41, 0.2, 0.62, P["black"]),
             block("hatch_stripe_a", -0.26, -0.2, 0.38, 0.4, 0.14, 0.7, P["yellow"]), block("hatch_stripe_b", 0.2, 0.26, 0.38, 0.4, 0.14, 0.7, P["yellow"]),
             block("body", -0.28, 0.28, 0.0, 0.4, 0.1, 0.46, P["steel"]), block("body_band", -0.29, 0.29, -0.01, 0.41, 0.28, 0.34, P["steel_dark"]),
             lpm.prism("cyclone", 8, 0.22, 0.3, at=(0, 0.2, 0.46), color=P["steel_dark"], radius_top=0.12),
             disc("cyclone_cap", 0.14, 0.05, (0, 0.2, 0.76), P["iron"], 8),
             block("chute", -0.1, 0.1, -0.42, 0.0, 0.2, 0.34, P["steel_dark"]), block("chute_lip", -0.12, 0.12, -0.44, -0.38, 0.14, 0.36, P["iron"]),
             block("lamp", -0.04, 0.04, -0.01, 0.01, 0.5, 0.56, P["red"]),
             *pneumatic_inlet("feed"), *belt_stub("out", -0.5, -0.42)]
    fan = [block("blade_a", -0.16, 0.16, 0.17, 0.23, 0.82, 0.84, P["yellow"]), block("blade_b", -0.03, 0.03, 0.04, 0.36, 0.82, 0.84, P["yellow"]),
           disc("fan_hub", 0.04, 0.05, (0, 0.2, 0.8), P["black"], 6)]
    return parts, {"spin-up": (fan, (0, 0.2, 0.8))}


def cleaner(rng):
    """Cleaner facing -y: the line brings the load in at the back, a perforated drum turns and shakes the dirt out into a hopper under it, the line takes it away at the front.
    The pneumatic feed comes in on the left in green, a dust box sits on top."""
    parts = [block("plinth", -0.42, 0.42, -0.42, 0.42, 0.0, 0.1, P["concrete_dark"]),
             block("frame_a", -0.3, -0.26, -0.3, 0.3, 0.1, 0.56, P["iron"]), block("frame_b", 0.26, 0.3, -0.3, 0.3, 0.1, 0.56, P["iron"]),
             block("rail_top_a", -0.3, -0.26, -0.3, 0.3, 0.52, 0.56, P["steel_dark"]), block("rail_top_b", 0.26, 0.3, -0.3, 0.3, 0.52, 0.56, P["steel_dark"]),
             block("dirt_hopper", -0.22, 0.22, -0.2, 0.2, 0.1, 0.18, P["wood_dark"]),
             block("dust_box", -0.16, 0.16, -0.12, 0.2, 0.56, 0.7, P["steel"]), block("dust_vent", -0.1, 0.1, -0.05, 0.14, 0.7, 0.74, P["black"]),
             block("in_chute", -0.12, 0.12, 0.3, 0.42, 0.34, 0.5, P["steel_dark"]), block("out_chute", -0.12, 0.12, -0.42, -0.3, 0.2, 0.34, P["steel_dark"]),
             block("lamp", -0.04, 0.04, -0.31, -0.29, 0.5, 0.56, P["green"]),
             *pneumatic_inlet("feed"), *belt_stub("in", 0.38, 0.5), *belt_stub("out", -0.5, -0.4)]
    drum = [horizontal(disc("drum", 0.2, 0.5, (0, 0, 0), P["steel"], 12), y=-0.25, z=0.36), horizontal(disc("band_front", 0.215, 0.04, (0, 0, 0), P["brass"], 12), y=-0.22, z=0.36),
            horizontal(disc("band_back", 0.215, 0.04, (0, 0, 0), P["brass"], 12), y=0.18, z=0.36),
            block("hole_a", -0.04, 0.04, -0.12, -0.04, 0.55, 0.57, P["black"]), block("hole_b", -0.04, 0.04, 0.04, 0.12, 0.55, 0.57, P["black"]),
            block("hole_c", 0.18, 0.2, -0.04, 0.04, 0.34, 0.38, P["black"]), block("hole_d", -0.2, -0.18, -0.04, 0.04, 0.34, 0.38, P["black"]),
            block("hole_e", -0.04, 0.04, 0.04, 0.12, 0.15, 0.17, P["black"]), block("hole_f", -0.04, 0.04, -0.12, -0.04, 0.15, 0.17, P["black"])]
    return parts, {"spin-y": (drum, (0, 0.0, 0.36))}


def bin_store(rng):
    """Storage bin facing -y: a wooden bin with steel bands, filled with what the line brings in over the back, a sliding gate and a tag board at the front where the worker
    stands, a lamp on the post. The line enters at the back through a raised belt that drops into the bin."""
    parts = [block("plinth", -0.42, 0.42, -0.42, 0.42, 0.0, 0.1, P["concrete_dark"]),
             block("floor", -0.36, 0.36, -0.3, 0.38, 0.1, 0.16, P["wood_dark"]),
             block("wall_back", -0.36, 0.36, 0.34, 0.38, 0.16, 0.6, P["wood"]), block("wall_left", -0.38, -0.34, -0.3, 0.38, 0.16, 0.6, P["wood"]),
             block("wall_right", 0.34, 0.38, -0.3, 0.38, 0.16, 0.6, P["wood"]), block("wall_front", -0.36, 0.36, -0.32, -0.28, 0.16, 0.4, P["wood"]),
             block("band_a", -0.39, 0.39, -0.33, 0.39, 0.26, 0.3, P["steel_dark"]), block("band_b", -0.39, 0.39, -0.33, 0.39, 0.46, 0.5, P["steel_dark"]),
             block("gate", -0.14, 0.14, -0.34, -0.3, 0.16, 0.34, P["iron"]), block("gate_handle", -0.05, 0.05, -0.36, -0.34, 0.28, 0.32, P["yellow"]),
             block("heap_a", -0.3, 0.3, -0.24, 0.3, 0.16, 0.38, P["ore"]), block("heap_b", -0.2, 0.2, -0.14, 0.2, 0.38, 0.5, P["ore"]),
             block("tag_post", 0.3, 0.34, -0.4, -0.36, 0.1, 0.5, P["iron"]), block("tag", 0.24, 0.4, -0.42, -0.4, 0.4, 0.54, P["white"]),
             block("tag_mark", 0.28, 0.36, -0.43, -0.42, 0.44, 0.5, P["blue"]), block("lamp", -0.34, -0.3, -0.34, -0.3, 0.6, 0.66, P["yellow"]),
             block("feed_belt", -0.1, 0.1, 0.34, 0.5, 0.5, 0.56, P["black"]), block("feed_rail_a", -0.12, -0.1, 0.34, 0.5, 0.5, 0.62, P["steel_dark"]),
             block("feed_rail_b", 0.1, 0.12, 0.34, 0.5, 0.5, 0.62, P["steel_dark"]),
             block("feed_leg_a", -0.12, -0.08, 0.42, 0.46, 0.1, 0.5, P["iron"]), block("feed_leg_b", 0.08, 0.12, 0.42, 0.46, 0.1, 0.5, P["iron"]),
             block("feed_drop", -0.1, 0.1, 0.2, 0.34, 0.5, 0.56, P["steel_dark"])]
    return parts, {}


def mirrored(builder):
    """The model a builder draws, turned into its mirror image across the x = 0 plane, with the pivots of its moving parts."""
    def build(rng):
        parts, spinners = builder(rng)
        flipped = {name: ([lpm.scale(part, sx=-1) for part in group], (-pivot[0], pivot[1], pivot[2])) for name, (group, pivot) in spinners.items()}
        return [lpm.scale(part, sx=-1) for part in parts], flipped
    return build


def plank_floor(rng):
    """Concrete floor tile centred on the origin, like the walls."""
    return checker_floor(P, "concrete", "concrete_dark", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the machines stay in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    """The band keeps its place on the wall (from 0.3), cut under the cap of the lower wall."""
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def brick_wall(rng):
    return half_height(thick_wall(P, "brick", "steel_dark", "brick_dark", "iron"))


def brick_partition(rng):
    return half_height(partition_wall(P, "brick", "steel_dark", "brick_dark", "iron"))


def brick_junction(arms):
    return lambda rng: half_height(junction_wall(P, "brick", "steel_dark", "brick_dark", "iron", arms))


def brick_corner(rng):
    return half_height(thick_corner(P, "brick", "steel_dark", "brick_dark", "iron"))


def wall_set():
    return {"floor": plank_floor, "wall": brick_wall, "partition": brick_partition, "partition-elbow": brick_junction("ES"), "partition-tee": brick_junction("WES"),
            "partition-cross": brick_junction("ESWN"), "wall-corner": brick_corner}


if __name__ == "__main__":
    models = {"extractor": extractor, "extractor-right": mirrored(extractor), "cleaner": cleaner, "cleaner-right": mirrored(cleaner), "bin": bin_store}
    export_all(models, P, 1400, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
