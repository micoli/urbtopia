import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall, thick_window_wall  # noqa: E402

P = lpm.Palette([
    ("wall", "#e9e2d2", 0.0, 0.9), ("wall_cap", "#d6cdb8", 0.0, 0.9), ("plinth", "#5d8f6a", 0.0, 0.8),
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("panel", "#2a2d3a", 0.0, 0.7), ("glass", "#cfeefa", 0.0, 0.2),
    ("wood", "#c48a54", 0.0, 0.8), ("wood_dark", "#7a4a2a", 0.0, 0.8), ("wood_light", "#d9a972", 0.0, 0.8),
    ("fabric", "#8e2f3a", 0.0, 0.95), ("fabric_dark", "#6e222c", 0.0, 0.95),
    ("white", "#f6f2ea", 0.0, 0.9), ("cloth", "#f3ede0", 0.0, 0.95), ("runner", "#b03a3a", 0.0, 0.95),
    ("flame", "#ff9a2e", 0.0, 0.4, 1.2), ("candle", "#fff3cf", 0.0, 0.8),
    ("green", "#5aae4a", 0.0, 0.7), ("red", "#e04848", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7), ("blue", "#4a8fe0", 0.0, 0.7),
    ("amber", "#c98b2f", 0.0, 0.5), ("bottle_green", "#3f7a52", 0.0, 0.3), ("bottle_brown", "#6b3f22", 0.0, 0.3),
    ("brass", "#d4a83a", 0.6, 0.35), ("skin_a", "#f0c8a0", 0.0, 0.8), ("skin_b", "#c8946a", 0.0, 0.8), ("skin_c", "#8a5a3a", 0.0, 0.8),
    ("hair_dark", "#3a2a22", 0.0, 0.9), ("hair_light", "#c9a050", 0.0, 0.9), ("check_a", "#4a4f5e", 0.0, 0.9), ("check_b", "#d5d9e2", 0.0, 0.9),
    ("black", "#22242c", 0.0, 0.7), ("eye", "#15161c", 0.0, 0.5),
])

HEIGHT = 1.0


def plain_wall(rng):
    return thick_wall(P, "wall", None, "plinth", "wall_cap")


def plain_partition(rng):
    return partition_wall(P, "wall", None, "plinth", "wall_cap")


def plain_junction(arms):
    return lambda rng: junction_wall(P, "wall", None, "plinth", "wall_cap", arms)


def plain_window_wall(rng):
    return thick_window_wall(P, "wall", "plinth", "glass", "plinth", "wall_cap")


def plain_corner(rng):
    return thick_corner(P, "wall", None, "plinth", "wall_cap")


def plank_floor(rng):
    """Wooden floor tile centred on the origin, like the walls."""
    return checker_floor(P, "wood", "wood_light", cells=4)


def wall_set():
    return {"floor": plank_floor, "wall": plain_wall, "partition": plain_partition, "partition-elbow": plain_junction("ES"), "partition-tee": plain_junction("WES"), "partition-cross": plain_junction("ESWN"), "wall-window": plain_window_wall, "wall-corner": plain_corner}


def sphere(name, radius, at, color, segments=6):
    return lpm.lathe(name, [(0, -radius), (radius * 0.9, -radius * 0.4), (radius, 0.0), (radius * 0.9, radius * 0.4), (0, radius)], segments=segments, at=at, color=color)


def cooktop(rng):
    """Range with four burners, knobs on the front, a pot and a pan; backsplash on +y."""
    parts = [block("body", -0.43, 0.43, -0.4, 0.34, 0.0, 0.5, P["steel"]), block("top", -0.43, 0.43, -0.4, 0.34, 0.5, 0.53, P["panel"]),
             block("backsplash", -0.43, 0.43, 0.34, 0.4, 0.0, 0.85, P["steel_dark"]), block("oven", -0.33, 0.33, -0.41, -0.4, 0.08, 0.36, P["panel"]),
             block("window", -0.25, 0.25, -0.415, -0.41, 0.14, 0.3, P["glass"]), block("rail", -0.36, 0.36, -0.44, -0.41, 0.4, 0.43, P["steel_dark"])]
    for k, (x, y) in enumerate(((-0.17, -0.15), (0.17, -0.15), (-0.17, 0.12), (0.17, 0.12))):
        parts.append(disc(f"burner{k}", 0.1, 0.012, (x, y, 0.53), P["steel_dark"], 8))
        parts.append(disc(f"flame{k}", 0.05, 0.016, (x, y, 0.53), P["flame"], 8))
    for k, x in enumerate((-0.27, -0.09, 0.09, 0.27)):
        parts.append(disc(f"knob{k}", 0.025, 0.025, (x, -0.425, 0.46), P["steel_dark"], 6))
    parts += [disc("pot", 0.095, 0.1, (-0.17, 0.12, 0.545), P["steel"], 8), disc("pot_lid", 0.1, 0.02, (-0.17, 0.12, 0.645), P["steel_dark"], 8),
              block("pot_h1", -0.3, -0.265, 0.1, 0.14, 0.6, 0.62, P["panel"]), block("pan_h", 0.2, 0.34, -0.17, -0.13, 0.545, 0.56, P["panel"]),
              disc("pan", 0.085, 0.03, (0.17, -0.15, 0.545), P["panel"], 8)]
    return parts


def prep_table(rng):
    """Steel table with a lower shelf, a cutting board, a knife, a bowl of vegetables."""
    parts = [block("top", -0.43, 0.43, -0.34, 0.34, 0.46, 0.5, P["steel"]), block("shelf", -0.4, 0.4, -0.31, 0.31, 0.14, 0.16, P["steel_dark"])]
    for k, (x, y) in enumerate(((-0.39, -0.3), (0.39, -0.3), (0.39, 0.3), (-0.39, 0.3))):
        parts.append(block(f"leg{k}", x - 0.02, x + 0.02, y - 0.02, y + 0.02, 0.0, 0.46, P["steel_dark"]))
    parts += [block("board", -0.34, -0.02, -0.2, 0.2, 0.5, 0.53, P["wood_light"]), block("knife", -0.3, -0.06, -0.015, 0.015, 0.53, 0.545, P["steel"]),
              block("knife_h", -0.06, 0.0, -0.02, 0.02, 0.53, 0.55, P["wood_dark"]),
              lpm.lathe("bowl", [(0.0, 0.0), (0.09, 0.0), (0.12, 0.09), (0.1, 0.09), (0.0, 0.02)], segments=8, at=(0.22, -0.1, 0.5), color=P["white"])]
    for k, (x, y, color) in enumerate(((0.2, -0.1, "red"), (0.25, -0.08, "green"), (0.22, -0.13, "yellow"))):
        parts.append(sphere(f"veg{k}", 0.04, (x, y, 0.59), P[color]))
    parts += [block("plates", 0.1, 0.35, 0.1, 0.3, 0.5, 0.56, P["white"]), block("tomato_crate", -0.3, -0.05, 0.12, 0.3, 0.5, 0.58, P["wood"])]
    parts += [sphere(f"tomato{k}", 0.035, (-0.22 + 0.09 * k, 0.21, 0.6), P["red"]) for k in range(3)]
    return parts


def bar(rng):
    """Bar counter facing -y (patrons), with a bottle shelf behind it on +y and a beer tap."""
    parts = [block("front", -0.5, 0.5, -0.4, -0.12, 0.0, 0.55, P["wood_dark"]), block("top", -0.5, 0.5, -0.45, 0.0, 0.55, 0.6, P["wood"]),
             block("foot", -0.5, 0.5, -0.46, -0.41, 0.1, 0.14, P["brass"]), block("panel", -0.4, 0.4, -0.405, -0.4, 0.12, 0.5, P["wood"]),
             block("back_cabinet", -0.5, 0.5, 0.3, 0.45, 0.0, 0.45, P["wood_dark"]), block("back_panel", -0.5, 0.5, 0.45, 0.5, 0.45, 0.95, P["wood_dark"]),
             block("shelf1", -0.48, 0.48, 0.3, 0.45, 0.62, 0.64, P["wood"]), block("shelf2", -0.48, 0.48, 0.3, 0.45, 0.8, 0.82, P["wood"]),
             block("tap_base", -0.04, 0.04, -0.14, -0.06, 0.6, 0.64, P["steel"]), block("tap_tower", -0.025, 0.025, -0.12, -0.08, 0.64, 0.78, P["steel"]),
             block("tap_spout", -0.015, 0.015, -0.2, -0.1, 0.72, 0.745, P["steel"])]
    for k, (x, color) in enumerate(((-0.38, "bottle_green"), (-0.28, "bottle_brown"), (-0.18, "amber"), (0.18, "bottle_green"), (0.28, "amber"), (0.38, "bottle_brown"))):
        level, z = (0, 0.64) if k % 2 == 0 else (1, 0.82)
        parts.append(lpm.prism(f"bottle{k}", 6, 0.03, 0.15, at=(x, 0.37, z), color=P[color]))
        parts.append(lpm.prism(f"neck{k}", 6, 0.014, 0.06, at=(x, 0.37, z + 0.15), color=P[color]))
    for k, x in enumerate((-0.32, 0.28, 0.4)):
        parts.append(lpm.lathe(f"glass{k}", [(0.0, 0.0), (0.03, 0.0), (0.04, 0.1), (0.0, 0.1)], segments=6, at=(x, -0.22, 0.6), color=P["glass"]))
    return parts


def waiting_armchair(rng):
    parts = [block("seat", -0.27, 0.27, -0.27, 0.27, 0.12, 0.28, P["fabric"]), block("back", -0.27, 0.27, 0.16, 0.3, 0.12, 0.64, P["fabric_dark"]),
             block("arm_l", -0.33, -0.22, -0.27, 0.3, 0.12, 0.42, P["fabric_dark"]), block("arm_r", 0.22, 0.33, -0.27, 0.3, 0.12, 0.42, P["fabric_dark"]),
             block("cushion", -0.2, 0.2, -0.2, 0.14, 0.28, 0.34, P["fabric"])]
    for k, (x, y) in enumerate(((-0.28, -0.22), (0.28, -0.22), (0.28, 0.25), (-0.28, 0.25))):
        parts.append(block(f"leg{k}", x - 0.025, x + 0.025, y - 0.025, y + 0.025, 0.0, 0.12, P["wood_dark"]))
    return parts


def chair(rng):
    """Faces -y, drawn forward in its tile (seat on y -0.46..-0.14) so that it sits against the table in front of it."""
    parts = [block("seat", -0.17, 0.17, -0.47, -0.13, 0.22, 0.27, P["fabric"]), block("seat_base", -0.16, 0.16, -0.46, -0.14, 0.2, 0.22, P["wood"]),
             block("back_l", -0.16, -0.12, -0.17, -0.13, 0.27, 0.64, P["wood"]), block("back_r", 0.12, 0.16, -0.17, -0.13, 0.27, 0.64, P["wood"]),
             block("back_top", -0.16, 0.16, -0.17, -0.13, 0.5, 0.64, P["wood"]), block("back_pad", -0.11, 0.11, -0.165, -0.14, 0.52, 0.62, P["fabric"])]
    for k, (x, y) in enumerate(((-0.145, -0.44), (0.145, -0.44), (0.145, -0.16), (-0.145, -0.16))):
        parts.append(block(f"leg{k}", x - 0.02, x + 0.02, y - 0.02, y + 0.02, 0.0, 0.22, P["wood"]))
    return parts


def stool(rng):
    """Faces -y like the chair; its round seat is drawn forward in the tile so that it sits against the Bar."""
    parts = [disc("seat", 0.16, 0.05, (0, -0.3, 0.46), P["fabric"], 10), disc("seat_base", 0.14, 0.03, (0, -0.3, 0.43), P["wood"], 10),
             disc("post", 0.025, 0.4, (0, -0.3, 0.04), P["steel_dark"], 6), disc("base", 0.14, 0.04, (0, -0.3, 0.0), P["steel"], 10),
             disc("rest", 0.1, 0.02, (0, -0.3, 0.17), P["brass"], 10)]
    return parts


def table(rng):
    """Square table with a cloth, a runner, two place settings and a candle; ~0.84 wide so that chairs sit close."""
    parts = [block("top", -0.42, 0.42, -0.42, 0.42, 0.4, 0.43, P["wood"]), block("cloth", -0.43, 0.43, -0.43, 0.43, 0.43, 0.45, P["cloth"]),
             block("drop_f", -0.43, 0.43, -0.45, -0.43, 0.3, 0.45, P["cloth"]), block("drop_b", -0.43, 0.43, 0.43, 0.45, 0.3, 0.45, P["cloth"]),
             block("drop_l", -0.45, -0.43, -0.45, 0.45, 0.3, 0.45, P["cloth"]), block("drop_r", 0.43, 0.45, -0.45, 0.45, 0.3, 0.45, P["cloth"]),
             block("runner", -0.07, 0.07, -0.43, 0.43, 0.45, 0.455, P["runner"]), block("column", -0.05, 0.05, -0.05, 0.05, 0.0, 0.4, P["wood_dark"]),
             block("foot_x", -0.3, 0.3, -0.04, 0.04, 0.0, 0.03, P["wood_dark"]), block("foot_y", -0.04, 0.04, -0.3, 0.3, 0.0, 0.03, P["wood_dark"]),
             disc("candle", 0.018, 0.07, (0, 0, 0.455), P["candle"], 6), disc("flame", 0.012, 0.025, (0, 0, 0.525), P["flame"], 6)]
    for k, (x, y) in enumerate(((0.0, -0.28), (0.0, 0.28), (-0.28, 0.0), (0.28, 0.0))):
        parts.append(disc(f"plate{k}", 0.075, 0.012, (x, y, 0.455), P["white"], 8))
    parts.append(lpm.lathe("glass", [(0.0, 0.0), (0.025, 0.0), (0.035, 0.08), (0.0, 0.08)], segments=6, at=(0.15, -0.2, 0.455), color=P["glass"]))
    return parts


if __name__ == "__main__":
    models = {
        "cooktop": cooktop, "prep-table": prep_table, "bar": bar, "waiting-armchair": waiting_armchair, "chair": chair, "stool": stool, "table": table,
    }
    export_all(models, P, 1200, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
