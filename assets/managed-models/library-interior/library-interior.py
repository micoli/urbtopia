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
    ("wood", "#b98650", 0.0, 0.9), ("wood_dark", "#8a5a30", 0.0, 0.9), ("wood_light", "#d9b27c", 0.0, 0.9), ("walnut", "#6a3e24", 0.0, 0.9),
    ("book_red", "#b8453a", 0.0, 0.9), ("book_blue", "#3f6fb0", 0.0, 0.9), ("book_green", "#4f8f5a", 0.0, 0.9), ("book_yellow", "#e0b84a", 0.0, 0.9), ("book_cream", "#eadfc6", 0.0, 0.9),
    ("fabric", "#8f3f4a", 0.0, 0.95), ("fabric_dark", "#6e2f38", 0.0, 0.95), ("rug", "#7a9bd0", 0.0, 1.0), ("parquet", "#c98f4e", 0.0, 0.8), ("parquet_dark", "#b8803f", 0.0, 0.8),
    ("wall", "#e6dcc3", 0.0, 0.9), ("lamp", "#ffe2a0", 0.0, 0.5, 1.5),
])


# The floor tiles are 0.03 thick and a Fixture is placed at height 0: every piece is lifted so that its feet stand on the floor instead of sinking into it.
FLOOR_TOP = 0.03
BOOKS = ("book_red", "book_blue", "book_green", "book_yellow", "book_cream")


def on_floor(build):
    def lifted(rng):
        return [lpm.move(part, 0, 0, FLOOR_TOP) for part in build(rng)]
    return lifted


def row_of_books(rng, name, x0, x1, y0, y1, z0, height):
    """A row of books standing on a shelf, of varied widths, heights and colours."""
    parts, x, k = [], x0, 0
    while x < x1 - 0.03:
        width = min(rng.choice((0.03, 0.04, 0.05)), x1 - x)
        tall = height * rng.choice((0.8, 0.9, 1.0))
        parts.append(block(f"{name}{k}", x, x + width, y0, y1, z0, z0 + tall, P[BOOKS[k % len(BOOKS)] if rng.random() < 0.5 else rng.choice(BOOKS)]))
        x += width + 0.004
        k += 1
    return parts


def bookshelf(rng):
    """Tall bookshelf against the wall on y 0, its front toward -y: two uprights, five shelves and a cornice, every shelf full of books."""
    parts = [block("left", -0.46, -0.42, -0.24, 0.0, 0.0, 1.1, P["wood_dark"]), block("right", 0.42, 0.46, -0.24, 0.0, 0.0, 1.1, P["wood_dark"]),
             block("back", -0.42, 0.42, -0.02, 0.0, 0.0, 1.1, P["walnut"]), block("top", -0.48, 0.48, -0.26, 0.0, 1.1, 1.14, P["wood"]), block("base", -0.46, 0.46, -0.24, 0.0, 0.0, 0.06, P["wood"])]
    for k, z in enumerate((0.06, 0.28, 0.5, 0.72, 0.94)):
        parts.append(block(f"shelf{k}", -0.42, 0.42, -0.22, 0.0, z, z + 0.02, P["wood"]))
        if k < 4:
            parts += row_of_books(rng, f"b{k}_", -0.4, 0.4, -0.18, -0.04, z + 0.02, 0.18)
    parts += row_of_books(rng, "b4_", -0.4, 0.4, -0.18, -0.04, 0.96, 0.12)
    return parts


def reading_table(rng):
    """Reading table with a green lamp and an open book, centred on its tile: a wide wooden top on four legs."""
    parts = [block(f"leg{k}", x - 0.03, x + 0.03, y - 0.03, y + 0.03, 0.0, 0.36, P["wood_dark"]) for k, (x, y) in enumerate(((-0.34, -0.2), (0.34, -0.2), (0.34, 0.2), (-0.34, 0.2)))]
    parts += [block("top", -0.42, 0.42, -0.26, 0.26, 0.36, 0.4, P["wood"]), block("apron", -0.38, 0.38, -0.22, 0.22, 0.3, 0.36, P["wood_dark"]),
              block("lamp_base", -0.34, -0.24, 0.08, 0.18, 0.4, 0.42, P["iron"]), block("lamp_stem", -0.3, -0.28, 0.12, 0.14, 0.42, 0.62, P["steel_dark"]),
              block("lamp_shade", -0.36, -0.22, 0.05, 0.21, 0.62, 0.7, P["green"]), block("lamp_bulb", -0.31, -0.27, 0.11, 0.15, 0.6, 0.62, P["lamp"]),
              block("book_left", -0.1, 0.0, -0.14, 0.04, 0.4, 0.415, P["book_cream"]), block("book_right", 0.0, 0.1, -0.14, 0.04, 0.4, 0.415, P["book_cream"]),
              block("book_cover", -0.11, 0.11, -0.15, 0.05, 0.4, 0.405, P["book_blue"]), block("stack_a", 0.2, 0.36, -0.1, 0.06, 0.4, 0.44, P["book_red"]), block("stack_b", 0.21, 0.35, -0.09, 0.05, 0.44, 0.47, P["book_green"])]
    return parts


def armchair(rng):
    """Reading armchair facing -y, centred on its tile: a padded seat, a high back and two arms on wooden feet."""
    parts = [block(f"foot{k}", x - 0.025, x + 0.025, y - 0.025, y + 0.025, 0.0, 0.08, P["wood_dark"]) for k, (x, y) in enumerate(((-0.3, -0.3), (0.3, -0.3), (0.3, 0.3), (-0.3, 0.3)))]
    parts += [block("seat", -0.32, 0.32, -0.34, 0.34, 0.08, 0.24, P["fabric"]), block("cushion", -0.26, 0.26, -0.3, 0.2, 0.24, 0.3, P["fabric_dark"]),
              block("back", -0.34, 0.34, 0.2, 0.36, 0.08, 0.7, P["fabric"]), block("back_top", -0.3, 0.3, 0.2, 0.36, 0.7, 0.76, P["fabric_dark"]),
              block("arm_l", -0.38, -0.3, -0.34, 0.36, 0.08, 0.42, P["fabric"]), block("arm_r", 0.3, 0.38, -0.34, 0.36, 0.08, 0.42, P["fabric"]),
              block("arm_l_top", -0.39, -0.29, -0.34, 0.2, 0.42, 0.46, P["fabric_dark"]), block("arm_r_top", 0.29, 0.39, -0.34, 0.2, 0.42, 0.46, P["fabric_dark"])]
    return parts


def lending_desk(rng):
    """Lending desk facing -y, where the librarian stands on the +y side: a wooden counter with a stamp, a card tray, a stack of returned books and a small lamp."""
    parts = [block("body", -0.46, 0.46, -0.22, 0.22, 0.0, 0.34, P["wood"]), block("plinth", -0.47, 0.47, -0.23, 0.23, 0.0, 0.05, P["wood_dark"]),
             block("top", -0.48, 0.48, -0.26, 0.26, 0.34, 0.38, P["wood_dark"]), block("panel_a", -0.4, -0.04, -0.23, -0.22, 0.1, 0.3, P["wood_light"]),
             block("panel_b", 0.04, 0.4, -0.23, -0.22, 0.1, 0.3, P["wood_light"]),
             block("tray", 0.2, 0.4, -0.12, 0.04, 0.38, 0.43, P["wood_light"]), block("cards", 0.22, 0.38, -0.1, 0.02, 0.43, 0.47, P["book_cream"]),
             block("stamp_base", -0.34, -0.26, -0.08, 0.0, 0.38, 0.4, P["iron"]), block("stamp_grip", -0.32, -0.28, -0.06, -0.02, 0.4, 0.46, P["red"]),
             block("stack_a", -0.18, 0.0, -0.1, 0.06, 0.38, 0.42, P["book_green"]), block("stack_b", -0.17, -0.01, -0.09, 0.05, 0.42, 0.45, P["book_yellow"]),
             block("lamp_stem", 0.04, 0.06, 0.12, 0.14, 0.38, 0.52, P["steel_dark"]), block("lamp_shade", 0.0, 0.1, 0.08, 0.18, 0.52, 0.58, P["green"])]
    return parts


def card_catalog(rng):
    """Card catalogue against the wall on y 0, its drawers toward -y: a wooden cabinet of twelve small drawers with a brass label and a knob each."""
    parts = [block("body", -0.4, 0.4, -0.22, 0.0, 0.0, 0.64, P["wood"]), block("top", -0.42, 0.42, -0.24, 0.0, 0.64, 0.68, P["wood_dark"]), block("plinth", -0.41, 0.41, -0.23, 0.0, 0.0, 0.05, P["wood_dark"])]
    for r in range(3):
        for c in range(4):
            x = -0.3 + 0.2 * c
            z = 0.1 + 0.17 * r
            parts += [block(f"drawer{r}{c}", x - 0.085, x + 0.085, -0.235, -0.22, z, z + 0.14, P["wood_light"]), block(f"label{r}{c}", x - 0.04, x + 0.04, -0.24, -0.235, z + 0.08, z + 0.12, P["brass"]),
                      block(f"knob{r}{c}", x - 0.015, x + 0.015, -0.25, -0.235, z + 0.03, z + 0.06, P["brass"])]
    return parts


def chair(rng):
    """Wooden reading chair facing -y, centred on its tile: a padded seat on four legs and a slatted back."""
    parts = [block(f"leg{k}", x - 0.02, x + 0.02, y - 0.02, y + 0.02, 0.0, 0.22, P["wood_dark"]) for k, (x, y) in enumerate(((-0.15, -0.15), (0.15, -0.15), (0.15, 0.15), (-0.15, 0.15)))]
    parts += [block("seat", -0.18, 0.18, -0.18, 0.18, 0.22, 0.26, P["wood"]), block("pad", -0.16, 0.16, -0.16, 0.16, 0.26, 0.3, P["fabric"]),
              block("post_l", -0.18, -0.14, 0.14, 0.18, 0.26, 0.62, P["wood_dark"]), block("post_r", 0.14, 0.18, 0.14, 0.18, 0.26, 0.62, P["wood_dark"]),
              block("rail_top", -0.18, 0.18, 0.14, 0.18, 0.56, 0.62, P["wood"]), block("slat_a", -0.1, -0.07, 0.15, 0.17, 0.3, 0.56, P["wood"]),
              block("slat_b", -0.015, 0.015, 0.15, 0.17, 0.3, 0.56, P["wood"]), block("slat_c", 0.07, 0.1, 0.15, 0.17, 0.3, 0.56, P["wood"])]
    return parts


def parquet_floor(rng):
    """Wooden parquet floor tile centred on the origin, like the walls."""
    return checker_floor(P, "parquet", "parquet_dark", cells=4)


def half_height(parts):
    """Walls stand at half the height of the Venue walls, so that the furniture stays in view."""
    return [clip_band(part) if part.name.startswith("band") else lpm.scale(part, sz=0.5) for part in parts]


def clip_band(band, top=0.47):
    for vertex in band.data.vertices:
        vertex.co.z = min(vertex.co.z, top)
    band.data.update()
    return band


def library_wall(rng):
    return half_height(thick_wall(P, "wall", "walnut", "wood_dark", "wood"))


def library_partition(rng):
    return half_height(partition_wall(P, "wall", "walnut", "wood_dark", "wood"))


def library_junction(arms):
    return lambda rng: half_height(junction_wall(P, "wall", "walnut", "wood_dark", "wood", arms))


def library_corner(rng):
    return half_height(thick_corner(P, "wall", "walnut", "wood_dark", "wood"))


def wall_set():
    return {"floor": parquet_floor, "wall": library_wall, "partition": library_partition, "partition-elbow": library_junction("ES"), "partition-tee": library_junction("WES"),
            "partition-cross": library_junction("ESWN"), "wall-corner": library_corner}


def fixtures():
    return {"bookshelf": on_floor(bookshelf), "reading-table": on_floor(reading_table), "armchair": on_floor(armchair), "chair": on_floor(chair), "lending-desk": on_floor(lending_desk), "card-catalog": on_floor(card_catalog)}


if __name__ == "__main__":
    export_all(fixtures(), P, 1600, HERE, center=False, ground=False)
    export_all(wall_set(), P, 900, HERE, center=False, ground=False)
