import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from model_lib import export_all, lpm  # noqa: E402
from venue_lib import block, checker_floor, disc, thick_corner, thick_wall, thick_window_wall, vertical_disc  # noqa: E402

P = lpm.Palette([
    ("wall", "#4a5068", 0.0, 0.9), ("wall_cap", "#5d6480", 0.0, 0.9), ("plinth", "#a9b0c8", 0.0, 0.8),
    ("band", "#3fb27f", 0.0, 0.8), ("floor", "#5a6178", 0.0, 0.9), ("floor_dark", "#454b60", 0.0, 0.9),
    ("cabinet", "#6a4fc4", 0.0, 0.7), ("cabinet_dark", "#4e3896", 0.0, 0.7), ("panel", "#2a2d3a", 0.0, 0.7),
    ("screen", "#7fe0ff", 0.0, 0.3, 1.2), ("marquee", "#ffd24a", 0.0, 0.4, 1.0),
    ("red", "#e04848", 0.0, 0.6), ("orange", "#f28a2c", 0.0, 0.6), ("green", "#3fb27f", 0.0, 0.6), ("blue", "#4a8fe0", 0.0, 0.6),
    ("pink", "#e65aa8", 0.0, 0.6), ("white", "#f2f4f8", 0.0, 0.6), ("glass", "#cfeefa", 0.0, 0.2), ("metal", "#a9b0c0", 0.5, 0.4),
    ("wood", "#b97a4a", 0.0, 0.8), ("wood_dark", "#7a4a2a", 0.0, 0.8), ("felt", "#2f9b62", 0.0, 0.95), ("felt_dark", "#23784c", 0.0, 0.95),
])

# Bounding boxes of the Kenney models these replace, in Blender axes (front on -y).
BOXES = {
    "air-hockey": ((-0.5, -0.35, 0.0), (0.5, 0.35, 0.5)),
    "arcade-machine": ((-0.2, -0.29, 0.0), (0.2, 0.24, 0.72)),
    "basketball-game": ((-0.33, -0.51, 0.0), (0.33, 0.5, 0.8)),
    "cash-register": ((-0.45, -0.25, 0.0), (0.45, 0.25, 0.54)),
    "claw-machine": ((-0.33, -0.35, 0.0), (0.33, 0.35, 0.95)),
    "dance-machine": ((-0.36, -0.51, 0.0), (0.36, 0.51, 0.95)),
    "pinball": ((-0.25, -0.43, 0.0), (0.25, 0.32, 0.74)),
    "pool-table": ((-0.95, -0.45, 0.0), (0.95, 0.45, 0.5)),
    "prize-wheel": ((-0.36, -0.15, 0.0), (0.36, 0.15, 0.91)),
    "ticket-machine": ((-0.2, -0.23, 0.0), (0.2, 0.16, 0.92)),
    "vending-machine": ((-0.25, -0.25, 0.0), (0.25, 0.22, 0.75)),
}


def air_hockey(rng):
    parts = [block("top", -0.48, 0.48, -0.33, 0.33, 0.32, 0.42, P["cabinet"]), block("ice", -0.44, 0.44, -0.29, 0.29, 0.42, 0.43, P["white"]),
             block("line", -0.01, 0.01, -0.29, 0.29, 0.43, 0.432, P["red"])]
    for k, (x, y) in enumerate(((-0.42, -0.27), (0.42, -0.27), (0.42, 0.27), (-0.42, 0.27))):
        parts.append(block(f"leg{k}", x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0, 0.32, P["panel"]))
    for k, x in enumerate((-0.48, 0.48)):
        parts.append(block(f"rim{k}", x - 0.02, x + 0.02, -0.33, 0.33, 0.42, 0.46, P["cabinet_dark"]))
    for k, (x, color) in enumerate(((-0.3, "red"), (0.3, "blue"))):
        parts += [disc(f"mallet{k}", 0.05, 0.03, (x, 0, 0.43), P[color]), disc(f"knob{k}", 0.02, 0.05, (x, 0, 0.46), P[color])]
    parts.append(disc("puck", 0.03, 0.015, (0.05, 0.08, 0.43), P["panel"]))
    return parts


def arcade_machine(rng):
    return [
        block("body", -0.18, 0.18, -0.12, 0.22, 0, 0.72, P["cabinet"]),
        block("base", -0.18, 0.18, -0.25, -0.12, 0, 0.38, P["cabinet_dark"]),
        block("panel", -0.18, 0.18, -0.29, -0.12, 0.38, 0.42, P["panel"]),
        block("screen", -0.14, 0.14, -0.125, -0.115, 0.45, 0.62, P["screen"]),
        block("marquee", -0.16, 0.16, -0.14, -0.12, 0.64, 0.7, P["marquee"]),
        disc("stick", 0.012, 0.06, (-0.07, -0.21, 0.42), P["panel"], 6), disc("ball", 0.025, 0.025, (-0.07, -0.21, 0.48), P["red"], 6),
        disc("b1", 0.018, 0.012, (0.04, -0.22, 0.42), P["green"], 6), disc("b2", 0.018, 0.012, (0.1, -0.2, 0.42), P["blue"], 6),
    ]


def basketball(rng):
    parts = [block("ramp", -0.3, 0.3, -0.5, 0.35, 0, 0.3, P["cabinet"]), block("lane", -0.26, 0.26, -0.46, 0.35, 0.3, 0.31, P["wood"]),
             block("guard", -0.3, 0.3, -0.5, -0.45, 0.3, 0.42, P["cabinet_dark"]),
             block("back", -0.32, 0.32, 0.35, 0.5, 0, 0.8, P["cabinet_dark"]), block("board", -0.2, 0.2, 0.33, 0.35, 0.5, 0.75, P["white"]),
             block("square", -0.07, 0.07, 0.328, 0.332, 0.52, 0.6, P["red"])]
    rim = lpm.prism("rim", 10, 0.08, 0.015, at=(0, 0.25, 0.52), color=P["orange"])
    net = lpm.prism("net", 10, 0.075, 0.08, at=(0, 0.25, 0.44), color=P["white"], radius_top=0.08)
    balls = [lpm.lathe(f"ball{k}", [(0, -0.04), (0.04, 0), (0, 0.04)], segments=6, at=(x, -0.3, 0.35), color=P["orange"]) for k, x in enumerate((-0.12, 0.0, 0.12))]
    return parts + [rim, net] + balls


def cash_register(rng):
    return [block("counter", -0.45, 0.45, -0.25, 0.25, 0, 0.42, P["cabinet"]), block("top", -0.45, 0.45, -0.25, 0.25, 0.42, 0.45, P["panel"]),
            block("strip", -0.45, 0.45, -0.255, -0.25, 0.2, 0.26, P["marquee"]),
            block("register", 0.05, 0.35, -0.12, 0.15, 0.45, 0.5, P["metal"]), block("display", 0.12, 0.3, 0.05, 0.08, 0.5, 0.54, P["screen"]),
            block("tickets", -0.35, -0.15, -0.1, 0.1, 0.45, 0.5, P["pink"])]


def claw_machine(rng):
    parts = [block("base", -0.33, 0.33, -0.33, 0.35, 0, 0.4, P["cabinet"]), block("chute", -0.25, -0.1, -0.35, -0.33, 0.1, 0.25, P["panel"]),
             block("glass", -0.3, 0.3, -0.3, 0.32, 0.4, 0.8, P["glass"]), block("roof", -0.33, 0.33, -0.33, 0.35, 0.8, 0.95, P["cabinet_dark"]),
             block("sign", -0.25, 0.25, -0.345, -0.33, 0.83, 0.92, P["marquee"]), block("cable", -0.005, 0.005, -0.005, 0.005, 0.6, 0.8, P["metal"]),
             block("claw", -0.04, 0.04, -0.04, 0.04, 0.56, 0.6, P["metal"])]
    for k in range(6):
        color = P[rng.choice(("red", "blue", "pink", "green", "orange"))]
        parts.append(lpm.lathe(f"prize{k}", [(0, -0.05), (0.05, 0), (0, 0.05)], segments=6, at=(rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), 0.45), color=color))
    return parts


def dance_machine(rng):
    parts = [block("stage", -0.36, 0.36, -0.51, 0.15, 0, 0.08, P["panel"]),
             block("rail", -0.3, 0.3, -0.05, 0.0, 0.08, 0.5, P["metal"]),
             block("cabinet", -0.36, 0.36, 0.15, 0.51, 0, 0.95, P["cabinet"]),
             block("screen", -0.22, 0.22, 0.14, 0.15, 0.5, 0.78, P["screen"]), block("top", -0.36, 0.36, 0.1, 0.51, 0.82, 0.95, P["marquee"])]
    for k, (x, y, color) in enumerate(((0, -0.18, "blue"), (0, -0.42, "blue"), (-0.13, -0.3, "pink"), (0.13, -0.3, "pink"))):
        parts.append(block(f"pad{k}", x - 0.055, x + 0.055, y - 0.055, y + 0.055, 0.08, 0.09, P[color]))
    for k, x in enumerate((-0.29, 0.29)):
        parts.append(vertical_disc(f"speaker{k}", 0.06, 0.01, (x, 0.145, 0.3), P["panel"]))
    return parts


def pinball(rng):
    table = block("table", -0.23, 0.23, -0.4, 0.2, 0, 0.08, P["cabinet"])
    lpm.rotate(table, 6, "X")
    lpm.move(table, 0, 0, 0.42)
    play = block("play", -0.2, 0.2, -0.37, 0.18, 0.08, 0.09, P["blue"])
    lpm.rotate(play, 6, "X")
    lpm.move(play, 0, 0, 0.42)
    parts = [table, play, block("backbox", -0.24, 0.24, 0.2, 0.32, 0.45, 0.74, P["cabinet_dark"]), block("backglass", -0.2, 0.2, 0.195, 0.2, 0.5, 0.7, P["marquee"])]
    for k, (x, y) in enumerate(((-0.2, -0.38), (0.2, -0.38), (0.2, 0.18), (-0.2, 0.18))):
        parts.append(block(f"leg{k}", x - 0.025, x + 0.025, y - 0.025, y + 0.025, 0, 0.44, P["metal"]))
    return parts


def pool_table(rng):
    parts = [block("apron", -0.9, 0.9, -0.4, 0.4, 0.22, 0.4, P["wood_dark"]), block("felt", -0.84, 0.84, -0.34, 0.34, 0.4, 0.42, P["felt"])]
    for k, (x, y) in enumerate(((-0.82, -0.32), (0.82, -0.32), (0.82, 0.32), (-0.82, 0.32))):
        parts.append(block(f"leg{k}", x - 0.07, x + 0.07, y - 0.07, y + 0.07, 0, 0.22, P["wood_dark"]))
    parts += [block("rail_back", -0.95, 0.95, 0.34, 0.45, 0.4, 0.48, P["wood"]), block("rail_front", -0.95, 0.95, -0.45, -0.34, 0.4, 0.48, P["wood"]),
              block("rail_left", -0.95, -0.84, -0.34, 0.34, 0.4, 0.48, P["wood"]), block("rail_right", 0.84, 0.95, -0.34, 0.34, 0.4, 0.48, P["wood"])]
    parts += [block("cushion_back", -0.78, 0.78, 0.3, 0.34, 0.42, 0.45, P["felt_dark"]), block("cushion_front", -0.78, 0.78, -0.34, -0.3, 0.42, 0.45, P["felt_dark"]),
              block("cushion_left", -0.84, -0.8, -0.28, 0.28, 0.42, 0.45, P["felt_dark"]), block("cushion_right", 0.8, 0.84, -0.28, 0.28, 0.42, 0.45, P["felt_dark"])]
    for k, (x, y) in enumerate(((-0.82, -0.32), (0.82, -0.32), (0.82, 0.32), (-0.82, 0.32), (0.0, -0.33), (0.0, 0.33))):
        parts.append(disc(f"pocket{k}", 0.055, 0.004, (x, y, 0.42), P["panel"], 8))
    radius = 0.03
    colors = ("marquee", "blue", "red", "pink", "orange", "green", "panel", "marquee", "blue", "red")
    rack = [(0.28 + 0.052 * column, (row - column / 2) * 0.06) for column in range(4) for row in range(column + 1)]
    for k, ((x, y), color) in enumerate(zip(rack, colors)):
        parts.append(lpm.lathe(f"ball{k}", [(0.004, 0), (radius, radius), (0.004, 2 * radius)], segments=6, at=(x, y, 0.42), color=P[color]))
    parts.append(lpm.lathe("cue_ball", [(0.004, 0), (radius, radius), (0.004, 2 * radius)], segments=6, at=(-0.4, 0.02, 0.42), color=P["white"]))
    return parts


def prize_wheel(rng):
    parts = [block("foot", -0.25, 0.25, -0.15, 0.15, 0, 0.06, P["panel"]), block("post", -0.04, 0.04, -0.04, 0.04, 0.06, 0.4, P["metal"]),
             vertical_disc("rim", 0.36, 0.06, (0, 0, 0.55), P["cabinet"], 16)]
    colors = ("red", "marquee", "blue", "green", "pink", "orange")
    for k in range(6):
        wedge = lpm.box(f"w{k}", (0.12, 0.01, 0.28), at=(0, 0, 0), color=P[colors[k]], taper=(0.15, 1.0))
        lpm.rotate(wedge, 180, "Y")
        lpm.move(wedge, 0, 0, 0.29)
        lpm.rotate(wedge, 60 * k, "Y")
        parts.append(lpm.move(wedge, 0, -0.035, 0.55))
    parts += [vertical_disc("hub", 0.05, 0.02, (0, -0.045, 0.55), P["white"], 8), block("pointer", -0.03, 0.03, -0.05, -0.02, 0.88, 0.91, P["panel"])]
    return parts


def ticket_machine(rng):
    return [block("body", -0.18, 0.18, -0.18, 0.16, 0, 0.8, P["cabinet"]), block("top", -0.2, 0.2, -0.2, 0.16, 0.8, 0.92, P["marquee"]),
            block("screen", -0.12, 0.12, -0.19, -0.18, 0.55, 0.72, P["screen"]), block("slot", -0.08, 0.08, -0.23, -0.18, 0.38, 0.42, P["panel"]),
            block("ticket", -0.05, 0.05, -0.22, -0.2, 0.3, 0.39, P["pink"])]


def vending_machine(rng):
    parts = [block("body", -0.25, 0.25, -0.22, 0.22, 0, 0.75, P["red"]), block("glass", -0.2, 0.08, -0.25, -0.22, 0.25, 0.7, P["glass"]),
             block("keypad", 0.12, 0.22, -0.24, -0.22, 0.45, 0.62, P["panel"]), block("tray", -0.2, 0.08, -0.24, -0.22, 0.06, 0.16, P["panel"])]
    for row in range(3):
        for col in range(3):
            parts.append(block(f"can{row}{col}", -0.17 + 0.09 * col, -0.11 + 0.09 * col, -0.2, -0.15, 0.3 + 0.13 * row, 0.38 + 0.13 * row,
                               P[("blue", "green", "marquee")[(row + col) % 3]]))
    return parts


if __name__ == "__main__":
    export_all({
        "air-hockey": air_hockey, "arcade-machine": arcade_machine, "basketball-game": basketball, "cash-register": cash_register,
        "claw-machine": claw_machine, "dance-machine": dance_machine, "pinball": pinball, "pool-table": pool_table, "prize-wheel": prize_wheel,
        "ticket-machine": ticket_machine, "vending-machine": vending_machine,
        "floor": lambda rng: checker_floor(P, "floor", "floor_dark"),
        "wall": lambda rng: thick_wall(P, "wall", "band", "plinth", "wall_cap"),
        "wall-window": lambda rng: thick_window_wall(P, "wall", "plinth", "glass", "plinth", "wall_cap"),
        "wall-corner": lambda rng: thick_corner(P, "wall", "band", "plinth", "wall_cap"),
    }, P, 800, HERE, boxes=BOXES, center=False, ground=False)
