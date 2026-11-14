import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, junction_wall, partition_wall, thick_corner, thick_wall  # noqa: E402

P = lpm.Palette([
    ("steel", "#c3c9d4", 0.5, 0.4), ("steel_dark", "#8a92a3", 0.5, 0.4), ("iron", "#4a4f5e", 0.4, 0.5), ("black", "#22242c", 0.0, 0.7),
    ("brass", "#d4a83a", 0.6, 0.35), ("red", "#e04848", 0.0, 0.7), ("green", "#5aae4a", 0.0, 0.7), ("yellow", "#f4c430", 0.0, 0.7),
    ("white", "#f6f2ea", 0.0, 0.9), ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5), ("sky", "#9cc7ea", 0.0, 0.8),
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9),
    ("board", "#2f5a48", 0.0, 0.95), ("board_dark", "#234637", 0.0, 0.95), ("chalk", "#f2f2ea", 0.0, 0.95),
    ("lino", "#e9e2c9", 0.0, 0.9), ("lino_dark", "#c7d3b8", 0.0, 0.9), ("wall", "#efe7d2", 0.0, 0.9), ("globe_sea", "#3f78b8", 0.0, 0.5), ("globe_land", "#6fae5a", 0.0, 0.5),
])


# The floor tiles are 0.03 thick and a Fixture is placed at height 0: every piece is lifted so that its feet stand on the floor instead of sinking into it.
FLOOR_TOP = 0.03


def on_floor(build):
    def lifted(rng):
        return [lpm.move(part, 0, 0, FLOOR_TOP) for part in build(rng)]
    return lifted


def school_desk(rng):
    """Pupil's desk with its chair, facing the board on +y: a slanted wooden top on a steel frame, an inkwell, and a chair behind it on the -y side."""
    parts = [block(f"leg{k}", x - 0.02, x + 0.02, y - 0.02, y + 0.02, 0.0, 0.34, P["steel_dark"]) for k, (x, y) in enumerate(((-0.28, 0.12), (0.28, 0.12), (-0.28, 0.34), (0.28, 0.34)))]
    parts += [block("top", -0.34, 0.34, 0.08, 0.4, 0.34, 0.38, P["wood_light"]), block("top_edge", -0.35, 0.35, 0.38, 0.41, 0.34, 0.4, P["wood_dark"]),
              block("shelf", -0.3, 0.3, 0.12, 0.38, 0.18, 0.2, P["wood"]),
              disc("inkwell", 0.025, 0.03, (0.26, 0.3, 0.38), P["blue_dark"], 6), block("book", -0.2, 0.0, 0.16, 0.3, 0.38, 0.41, P["red"]), block("book_pages", -0.19, -0.01, 0.17, 0.29, 0.38, 0.4, P["white"])]
    parts += [block(f"chair_leg{k}", x - 0.015, x + 0.015, y - 0.015, y + 0.015, 0.0, 0.22, P["steel_dark"]) for k, (x, y) in enumerate(((-0.12, -0.34), (0.12, -0.34), (-0.12, -0.12), (0.12, -0.12)))]
    parts += [block("seat", -0.15, 0.15, -0.38, -0.08, 0.22, 0.26, P["blue"]), block("back", -0.15, 0.15, -0.38, -0.35, 0.26, 0.5, P["blue_dark"])]
    return parts


def blackboard(rng):
    """Blackboard that hangs on the wall on y 0: its back on the wall, its face toward -y, centred on x, its centre at two thirds of the wall height, with a chalk tray and some writing."""
    cx, cz = 0.0, 0.66
    parts = [block("frame", -0.46, 0.46, -0.04, 0.0, cz - 0.24, cz + 0.24, P["wood_dark"]), block("surface", -0.43, 0.43, -0.05, -0.035, cz - 0.21, cz + 0.21, P["board"]),
             block("tray", -0.4, 0.4, -0.09, -0.04, cz - 0.25, cz - 0.22, P["wood"]), block("chalk_a", -0.3, -0.24, -0.075, -0.06, cz - 0.22, cz - 0.2, P["chalk"]),
             block("chalk_b", -0.2, -0.16, -0.075, -0.06, cz - 0.22, cz - 0.2, P["yellow"])]
    parts += [block(f"line{k}", -0.36 + 0.03 * k, 0.1 - 0.02 * k, -0.052, -0.05, cz + 0.08 - 0.07 * (k % 3), cz + 0.1 - 0.07 * (k % 3), P["chalk"]) for k in range(3)]
    return parts


def lockers(rng):
    """Row of three tall lockers against the wall on y 0, their doors toward -y: blue doors with a vent and a handle each."""
    parts = [block("body", -0.45, 0.45, -0.28, 0.0, 0.0, 1.0, P["blue_dark"]), block("top", -0.46, 0.46, -0.29, 0.0, 0.98, 1.02, P["steel_dark"]), block("base", -0.46, 0.46, -0.29, 0.0, 0.0, 0.06, P["iron"])]
    for k, x in enumerate((-0.3, 0.0, 0.3)):
        parts += [block(f"door{k}", x - 0.13, x + 0.13, -0.3, -0.28, 0.08, 0.96, P["blue"]), block(f"vent{k}", x - 0.07, x + 0.07, -0.305, -0.3, 0.82, 0.9, P["black"]),
                  block(f"handle{k}", x + 0.07, x + 0.1, -0.32, -0.3, 0.46, 0.58, P["steel"])]
    return parts


def teacher_desk(rng):
    """Teacher's desk facing -y, with drawers on the right, a lamp, an apple and a stack of copybooks; the teacher stands behind it on the +y side."""
    parts = [block("top", -0.44, 0.44, -0.24, 0.24, 0.36, 0.4, P["wood_dark"]), block("left_panel", -0.42, -0.38, -0.22, 0.22, 0.0, 0.36, P["wood"]),
             block("cabinet", 0.1, 0.42, -0.22, 0.22, 0.0, 0.36, P["wood"]), block("back_panel", -0.4, 0.1, 0.18, 0.22, 0.1, 0.36, P["wood"]),
             block("drawer_a", 0.14, 0.38, -0.235, -0.22, 0.2, 0.32, P["wood_light"]), block("drawer_b", 0.14, 0.38, -0.235, -0.22, 0.04, 0.16, P["wood_light"]),
             block("knob_a", 0.24, 0.28, -0.25, -0.235, 0.24, 0.28, P["brass"]), block("knob_b", 0.24, 0.28, -0.25, -0.235, 0.08, 0.12, P["brass"]),
             block("lamp_base", -0.38, -0.3, 0.0, 0.08, 0.4, 0.42, P["iron"]), block("lamp_stem", -0.35, -0.33, 0.03, 0.05, 0.42, 0.6, P["steel_dark"]), block("lamp_shade", -0.4, -0.28, -0.02, 0.1, 0.6, 0.66, P["green"]),
             disc("apple", 0.035, 0.05, (-0.05, -0.08, 0.4), P["red"], 6), disc("apple_stem", 0.008, 0.02, (-0.05, -0.08, 0.45), P["wood_dark"], 4),
             block("copybook_a", 0.0, 0.2, -0.16, 0.0, 0.4, 0.43, P["blue"]), block("copybook_b", 0.01, 0.21, -0.15, 0.01, 0.43, 0.46, P["white"]), block("copybook_c", -0.01, 0.19, -0.16, 0.0, 0.46, 0.49, P["red"])]
    return parts


def globe(rng):
    """Globe on a wooden stand, centred on its tile: a rounded sphere whose land is painted on its faces, in a brass meridian, on a stepped round foot that stands on the floor."""
    centre = (0.0, 0.0, 0.59)
    radius = 0.175
    profile = [(0.0, 0.0)] + [(radius * math.sin(a), radius * (1 - math.cos(a))) for a in (math.radians(d) for d in (20, 40, 60, 80, 100, 120, 140, 160))] + [(0.0, 2 * radius)]
    sphere = lpm.lathe("sphere", profile, segments=16, at=(0, 0, centre[2] - radius), color=P["globe_sea"])
    continents = [((0.9, -0.4, 0.2), 0.75), ((-0.4, -0.85, 0.3), 0.7), ((0.2, -0.3, 0.95), 0.55), ((-0.9, 0.2, -0.3), 0.6), ((0.3, 0.8, -0.4), 0.6)]

    def on_land(center, normal, index):
        direction = (center - lpm.Vector(centre)).normalized()
        return any(direction.dot(lpm.Vector(axis).normalized()) > math.cos(reach) for axis, reach in continents)

    lpm.paint(sphere, P["globe_land"], where=on_land)
    parts = [disc("foot_low", 0.15, 0.04, (0, 0, 0.0), P["wood_dark"], 12), disc("foot_high", 0.11, 0.04, (0, 0, 0.04), P["wood"], 12), disc("stem", 0.025, 0.4, (0, 0, 0.08), P["wood"], 6),
             disc("cup", 0.07, 0.04, (0, 0, 0.44), P["wood_dark"], 10), sphere,
             block("meridian_a", -0.195, -0.18, -0.012, 0.012, 0.5, 0.78, P["brass"]), block("meridian_b", 0.18, 0.195, -0.012, 0.012, 0.5, 0.78, P["brass"]),
             block("meridian_top", -0.195, 0.195, -0.012, 0.012, 0.78, 0.8, P["brass"])]
    return parts


def lino_floor(rng):
    """Linoleum floor tile centred on the origin, like the walls."""
    return checker_floor(P, "lino", "lino_dark", cells=2)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the furniture stays in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def school_wall(rng):
    return half_height(thick_wall(P, "wall", "green", "wood_dark", "wood"))


def school_partition(rng):
    return half_height(partition_wall(P, "wall", "green", "wood_dark", "wood"))


def school_junction(arms):
    return lambda rng: half_height(junction_wall(P, "wall", "green", "wood_dark", "wood", arms))


def school_corner(rng):
    return half_height(thick_corner(P, "wall", "green", "wood_dark", "wood"))


def wall_set():
    return {"floor": lino_floor, "wall": school_wall, "partition": school_partition, "partition-elbow": school_junction("ES"), "partition-tee": school_junction("WES"),
            "partition-cross": school_junction("ESWN"), "wall-corner": school_corner}


def fixtures():
    return {"desk": on_floor(school_desk), "blackboard": on_floor(blackboard), "lockers": on_floor(lockers), "teacher-desk": on_floor(teacher_desk), "globe": on_floor(globe)}


if __name__ == "__main__":
    models = fixtures()
    export_all(models, P, 800, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
