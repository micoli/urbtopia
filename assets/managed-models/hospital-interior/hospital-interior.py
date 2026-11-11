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
    ("white", "#f6f2ea", 0.0, 0.9), ("blue", "#3f6fb5", 0.2, 0.5), ("blue_dark", "#2c4f86", 0.2, 0.5), ("sky", "#9cc7ea", 0.0, 0.8), ("glass", "#cfeefa", 0.0, 0.2),
    ("sheet", "#f6f2ea", 0.0, 0.95), ("blanket", "#7fc4c0", 0.0, 0.95), ("pillow", "#ffffff", 0.0, 0.95), ("teal", "#2f9e8f", 0.2, 0.5), ("teal_dark", "#1f6e63", 0.2, 0.5),
    ("mint", "#d9efe9", 0.0, 0.9), ("tile", "#eef3f6", 0.0, 0.9), ("tile_dark", "#d3e2e6", 0.0, 0.9), ("screen", "#16352f", 0.0, 0.2), ("pulse", "#5df2a8", 0.0, 0.4, 1.5),
    ("scrub", "#3f9aa8", 0.0, 0.9), ("lamp", "#fff4c8", 0.0, 0.5, 1.5), ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9),
])


# The floor tiles are 0.03 thick and a Fixture is placed at height 0: every piece is lifted so that its feet stand on the floor instead of sinking into it.
FLOOR_TOP = 0.03


def on_floor(build):
    def lifted(rng):
        return [lpm.move(part, 0, 0, FLOOR_TOP) for part in build(rng)]
    return lifted


def wheels(x0, x1, y0, y1, radius=0.035):
    """Four small castors under a frame."""
    return [disc(f"wheel{k}", radius, 0.04, (x, y, 0.0), P["iron"], 6) for k, (x, y) in enumerate(((x0, y0), (x1, y0), (x1, y1), (x0, y1)))]


def hospital_bed(rng):
    """Hospital bed with its head on +y, centred on its tile: a steel frame on castors, a mattress with a pillow and a teal blanket, rails on both sides and a drip stand at the foot."""
    parts = wheels(-0.2, 0.2, -0.4, 0.4)
    parts += [block("frame", -0.26, 0.26, -0.44, 0.44, 0.08, 0.14, P["steel"]), block("base", -0.2, 0.2, -0.36, 0.36, 0.04, 0.08, P["steel_dark"]),
              block("mattress", -0.24, 0.24, -0.42, 0.42, 0.14, 0.24, P["sheet"]), block("blanket", -0.25, 0.25, -0.42, 0.14, 0.2, 0.27, P["blanket"]), block("blanket_fold", -0.25, 0.25, 0.12, 0.2, 0.2, 0.28, P["teal"]),
              block("pillow", -0.17, 0.17, 0.24, 0.4, 0.24, 0.3, P["pillow"]), block("headboard", -0.27, 0.27, 0.42, 0.46, 0.08, 0.5, P["teal_dark"]), block("footboard", -0.27, 0.27, -0.46, -0.42, 0.08, 0.32, P["teal_dark"]),
              block("rail_l", -0.28, -0.26, -0.3, 0.2, 0.2, 0.42, P["steel"]), block("rail_r", 0.26, 0.28, -0.3, 0.2, 0.2, 0.42, P["steel"]),
              block("stand", 0.3, 0.32, -0.4, -0.38, 0.04, 0.9, P["steel_dark"]), block("stand_arm", 0.22, 0.34, -0.405, -0.375, 0.88, 0.9, P["steel_dark"]), block("drip", 0.24, 0.3, -0.41, -0.37, 0.66, 0.84, P["glass"]),
              block("drip_fill", 0.25, 0.29, -0.4, -0.38, 0.66, 0.76, P["sky"])]
    return parts


def operating_table(rng):
    """Operating table centred on its tile: a padded top on a central steel column, with a shadowless lamp on an arm above it."""
    parts = [block("foot", -0.22, 0.22, -0.38, 0.38, 0.0, 0.06, P["steel_dark"]), block("column", -0.07, 0.07, -0.07, 0.07, 0.06, 0.4, P["steel"]),
             block("top", -0.2, 0.2, -0.44, 0.44, 0.4, 0.46, P["steel"]), block("pad", -0.18, 0.18, -0.4, 0.4, 0.46, 0.5, P["scrub"]), block("head_pad", -0.12, 0.12, 0.28, 0.4, 0.5, 0.54, P["scrub"]),
             block("arm_post", 0.34, 0.38, -0.04, 0.04, 0.0, 1.0, P["steel"]), block("arm", -0.1, 0.38, -0.03, 0.03, 0.96, 1.0, P["steel"]),
             disc("lamp_shade", 0.14, 0.06, (-0.1, 0.0, 0.88), P["white"], 10), disc("lamp_light", 0.1, 0.02, (-0.1, 0.0, 0.86), P["lamp"], 8), disc("lamp_hub", 0.03, 0.06, (-0.1, 0.0, 0.94), P["steel_dark"], 6)]
    return parts


def vitals_monitor(rng):
    """Vitals monitor on a trolley, its screen toward -y, centred on its tile: a screen with a green pulse line, a keypad and a basket of leads."""
    parts = wheels(-0.16, 0.16, -0.16, 0.16)
    parts += [block("trolley_base", -0.2, 0.2, -0.2, 0.2, 0.04, 0.08, P["steel_dark"]), block("pole", -0.03, 0.03, -0.03, 0.03, 0.08, 0.7, P["steel"]),
              block("shelf", -0.18, 0.18, -0.16, 0.16, 0.4, 0.43, P["steel"]), block("basket", -0.14, 0.14, -0.12, 0.12, 0.43, 0.5, P["teal_dark"]),
              block("monitor", -0.22, 0.22, -0.1, 0.08, 0.7, 0.98, P["iron"]), block("screen", -0.19, 0.19, -0.105, -0.1, 0.73, 0.95, P["screen"]),
              block("pulse_a", -0.16, -0.08, -0.108, -0.105, 0.82, 0.84, P["pulse"]), block("pulse_b", -0.08, -0.04, -0.108, -0.105, 0.84, 0.9, P["pulse"]), block("pulse_c", -0.04, 0.0, -0.108, -0.105, 0.76, 0.9, P["pulse"]),
              block("pulse_d", 0.0, 0.16, -0.108, -0.105, 0.82, 0.84, P["pulse"]), block("pulse_dot", 0.14, 0.17, -0.108, -0.105, 0.78, 0.81, P["red"])]
    return parts


def medicine_cabinet(rng):
    """Tall medicine cabinet against the wall on y 0, its glass doors toward -y: shelves of bottles and boxes, and a red cross."""
    parts = [block("body", -0.4, 0.4, -0.22, 0.0, 0.0, 0.96, P["mint"]), block("top", -0.42, 0.42, -0.24, 0.0, 0.96, 1.0, P["teal_dark"]), block("plinth", -0.41, 0.41, -0.23, 0.0, 0.0, 0.05, P["teal_dark"]),
             block("door_l", -0.38, -0.01, -0.235, -0.22, 0.46, 0.94, P["glass"]), block("door_r", 0.01, 0.38, -0.235, -0.22, 0.46, 0.94, P["glass"]),
             block("lower_l", -0.38, -0.01, -0.235, -0.22, 0.08, 0.44, P["teal"]), block("lower_r", 0.01, 0.38, -0.235, -0.22, 0.08, 0.44, P["teal"]),
             block("handle_l", -0.05, -0.03, -0.25, -0.235, 0.6, 0.76, P["steel"]), block("handle_r", 0.03, 0.05, -0.25, -0.235, 0.6, 0.76, P["steel"]),
             block("cross_v", 0.2, 0.26, -0.25, -0.235, 0.18, 0.38, P["red"]), block("cross_h", 0.16, 0.3, -0.25, -0.235, 0.24, 0.32, P["red"])]
    for k, z in enumerate((0.64, 0.8)):
        parts.append(block(f"shelf{k}", -0.38, 0.38, -0.2, -0.02, z, z + 0.015, P["steel_dark"]))
    for k, (x, z, colour) in enumerate(((-0.3, 0.495, "red"), (-0.22, 0.495, "blue"), (-0.12, 0.495, "green"), (0.1, 0.495, "yellow"), (0.22, 0.495, "blue"),
                                        (-0.3, 0.655, "green"), (-0.18, 0.655, "red"), (0.14, 0.655, "yellow"), (0.26, 0.655, "blue"), (-0.28, 0.815, "blue"), (0.0, 0.815, "red"), (0.24, 0.815, "green"))):
        parts.append(block(f"bottle{k}", x - 0.03, x + 0.03, -0.14, -0.08, z, z + 0.09, P[colour]))
    return parts


def waiting_chair(rng):
    """Waiting chair facing -y, centred on its tile: a moulded teal seat and back on a steel frame."""
    parts = [block(f"leg{k}", x - 0.015, x + 0.015, y - 0.015, y + 0.015, 0.0, 0.22, P["steel_dark"]) for k, (x, y) in enumerate(((-0.15, -0.15), (0.15, -0.15), (0.15, 0.15), (-0.15, 0.15)))]
    parts += [block("seat", -0.19, 0.19, -0.19, 0.19, 0.22, 0.27, P["teal"]), block("back", -0.19, 0.19, 0.15, 0.2, 0.27, 0.6, P["teal"]), block("back_top", -0.17, 0.17, 0.15, 0.2, 0.6, 0.64, P["teal_dark"]),
              block("brace", -0.15, 0.15, 0.14, 0.16, 0.22, 0.28, P["steel"])]
    return parts


def tile_floor(rng):
    """White tile floor centred on the origin, like the walls."""
    return checker_floor(P, "tile", "tile_dark", cells=2)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the furniture stays in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def mint_wall(rng):
    return half_height(thick_wall(P, "mint", "teal", "teal_dark", "steel_dark"))


def mint_partition(rng):
    return half_height(partition_wall(P, "mint", "teal", "teal_dark", "steel_dark"))


def mint_junction(arms):
    return lambda rng: half_height(junction_wall(P, "mint", "teal", "teal_dark", "steel_dark", arms))


def mint_corner(rng):
    return half_height(thick_corner(P, "mint", "teal", "teal_dark", "steel_dark"))


def wall_set():
    return {"floor": tile_floor, "wall": mint_wall, "partition": mint_partition, "partition-elbow": mint_junction("ES"), "partition-tee": mint_junction("WES"),
            "partition-cross": mint_junction("ESWN"), "wall-corner": mint_corner}


def fixtures():
    return {"bed": on_floor(hospital_bed), "operating-table": on_floor(operating_table), "vitals-monitor": on_floor(vitals_monitor), "medicine-cabinet": on_floor(medicine_cabinet),
            "waiting-chair": on_floor(waiting_chair)}


if __name__ == "__main__":
    export_all(fixtures(), P, 1000, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
