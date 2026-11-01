"""Navy frigate, the opponent of the Pirate ships in a Show: slim blue and white hull with a gold stripe, a gun in every port, raised quarterdeck with a stern gallery, two masts with white sails, bow at -Y."""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("navy", "#27406e"), ("navy_dark", "#1b2c4d"), ("hull_white", "#ece8dc"), ("deck", "#c79a64"), ("deck_dark", "#a67c4c"), ("wood_dark", "#5a331b"), ("wood", "#8a5530"), ("sail", "#f5f2e8"), ("gold", "#ffcf3a"), ("flag_red", "#b5342c"), ("rope", "#b9a57a"), ("iron", "#3a3a44")]
P = kit.palette(COLORS)

LENGTH, BEAM = 4.6, 1.25
STATIONS = [(0.0, 0.0), (0.03, 0.34), (0.08, 0.55), (0.16, 0.76), (0.28, 0.92), (0.42, 1.0), (0.72, 1.0), (0.9, 0.92), (1.0, 0.78)]
BANDS = [(0.55, 0.8, "navy_dark"), (0.78, 0.92, "navy"), (0.94, 0.98, "navy"), (1.0, 1.0, "hull_white"), (1.0, 1.0, "gold"), (0.98, 1.0, "navy")]
BAND_H = 0.1
DECK = BAND_H * len(BANDS)
MASTS = ((-0.75, 2.5, 1.05), (0.85, 2.2, 0.95))


def hull_side(y, beam_k=1.0):
    t = min(max((y + LENGTH / 2) / LENGTH, 0.0), 1.0)
    for (t0, w0), (t1, w1) in zip(STATIONS, STATIONS[1:]):
        if t <= t1:
            return BEAM / 2 * beam_k * (w0 + (w1 - w0) * (t - t0) / (t1 - t0))
    return BEAM / 2 * beam_k


def gun_port(side, y, z):
    """A port with its lid raised on the white strake, a gun run out through it."""
    x = side * hull_side(y)
    parts = [
        lpm.box("port", (0.03, 0.14, 0.09), at=(x, y, z - 0.01), color=P["black"]),
        lpm.box("port lid", (0.035, 0.15, 0.022), at=(x, y, z + 0.08), color=P["navy"]),
    ]
    barrel = lpm.prism("gun", 8, 0.028, 0.14, at=(0, 0, 0), color=P["iron"], radius_top=0.024)
    muzzle = lpm.prism("muzzle", 8, 0.034, 0.02, at=(0, 0, 0.12), color=P["iron"])
    for part in (barrel, muzzle):
        lpm.rotate(part, 90 * side, "Y")
        parts.append(lpm.move(part, x, y, z + 0.035))
    return parts


parts = []
for index, (beam_k, length_k, colour) in enumerate(BANDS):
    parts.append(lpm.sweep(f"hull band {index}", tk.plan(LENGTH * length_k, BEAM * beam_k, STATIONS), BAND_H, at=(0, 0, index * BAND_H), color=P[colour], axis="z"))
parts.append(lpm.sweep("deck", tk.plan(LENGTH * 0.94, BEAM * 0.84, STATIONS), 0.03, at=(0, 0, DECK - 0.01), color=P["deck"], axis="z"))
for x in (-0.3, -0.15, 0.0, 0.15, 0.3):
    parts.append(lpm.box("deck seam", (0.012, 3.0, 0.004), at=(x, -0.25, DECK + 0.02), color=P["deck_dark"]))

for side in (-1, 1):
    for y in (-1.3, -0.85, -0.4, 0.05, 0.5, 0.95, 1.4):
        parts += gun_port(side, y, 0.33)

# Raised quarterdeck: panelled sides, a gallery of windows at the stern, a rail and the helm.
Q_FRONT, Q_BACK, Q_HEIGHT = 1.2, 2.24, 0.3
parts.append(lpm.box("quarterdeck", (BEAM * 0.86, Q_BACK - Q_FRONT, Q_HEIGHT), at=(0, (Q_FRONT + Q_BACK) / 2, DECK), color=P["hull_white"]))
parts.append(lpm.box("quarterdeck band", (BEAM * 0.875, Q_BACK - Q_FRONT + 0.015, 0.035), at=(0, (Q_FRONT + Q_BACK) / 2, DECK + 0.13), color=P["gold"]))
parts.append(lpm.box("quarterdeck top", (BEAM * 0.89, Q_BACK - Q_FRONT + 0.03, 0.03), at=(0, (Q_FRONT + Q_BACK) / 2, DECK + Q_HEIGHT), color=P["deck"]))
TOP = DECK + Q_HEIGHT + 0.03
for side in (-1, 1):
    for y in (1.42, 1.72, 2.02):
        parts.append(lpm.box("cabin window", (0.015, 0.14, 0.085), at=(side * BEAM * 0.43, y, DECK + 0.03), color=P["gold"]))
    for y in (1.25, 1.5, 1.75, 2.0, 2.2):
        parts.append(lpm.box("rail post", (0.025, 0.025, 0.1), at=(side * BEAM * 0.425, y, TOP), color=P["hull_white"]))
    parts.append(lpm.box("rail", (0.03, 0.98, 0.022), at=(side * BEAM * 0.425, 1.725, TOP + 0.1), color=P["wood_dark"]))
for x in (-0.36, -0.12, 0.12, 0.36):
    parts.append(lpm.box("stern window", (0.17, 0.02, 0.17), at=(x, Q_BACK + 0.008, DECK + 0.06), color=P["gold"]))
    parts.append(lpm.box("stern mullion", (0.018, 0.024, 0.17), at=(x, Q_BACK + 0.012, DECK + 0.06), color=P["navy_dark"]))
parts.append(lpm.box("stern rail", (BEAM * 0.86, 0.03, 0.022), at=(0, 2.2, TOP + 0.1), color=P["wood_dark"]))
parts.append(lpm.box("break rail", (BEAM * 0.86, 0.03, 0.022), at=(0, Q_FRONT + 0.02, TOP + 0.1), color=P["wood_dark"]))
parts.append(lpm.box("helm post", (0.06, 0.06, 0.13), at=(0, 1.42, TOP), color=P["wood_dark"]))
parts.append(tk.cyl_y(P, "wood", 10, 0.1, 1.4, 1.44, TOP + 0.17, name="helm wheel"))
parts.append(tk.cyl_y(P, "iron", 6, 0.03, 1.385, 1.455, TOP + 0.17, name="helm hub"))
parts.append(lpm.box("skylight", (0.3, 0.26, 0.07), at=(0, 1.86, TOP), color=P["wood_dark"], taper=(0.8, 0.8)))
parts.append(lpm.box("lantern", (0.07, 0.07, 0.14), at=(0.4, 2.14, TOP + 0.13), color=P["gold"]))

# Forecastle, rounded off towards the bow, behind a balcony whose solid bulwark hides its base.
F_FRONT, F_ROUND_END, F_BACK, F_HEIGHT = -1.98, -1.55, -1.2, 0.15
F_YS = [F_FRONT + (F_ROUND_END - F_FRONT) * u for u in (0.0, 0.06, 0.22, 0.55, 1.0)] + [F_BACK]


def fore_width(y):
    """Half width of the forecastle: the deck's, drawn in by a quarter ellipse over its front."""
    if y >= F_ROUND_END:
        return hull_side(y, 0.86)
    u = (F_ROUND_END - y) / (F_ROUND_END - F_FRONT)
    return max(0.02, min(hull_side(y, 0.86), hull_side(F_ROUND_END, 0.86) * math.sqrt(max(0.0, 1 - u * u))))


def fore_loft(name, z0, z1, grow, colour):
    verts, faces = [], []
    for y in F_YS:
        half = fore_width(y) + grow
        verts += [(-half, y, z0), (half, y, z0), (half, y, z1), (-half, y, z1)]
    for index in range(len(F_YS) - 1):
        a, b = index * 4, (index + 1) * 4
        faces += [(a + 1, b + 1, b + 2, a + 2), (a, a + 3, b + 3, b), (a + 3, a + 2, b + 2, b + 3), (a, b, b + 1, a + 1)]
    last = (len(F_YS) - 1) * 4
    faces += [(0, 1, 2, 3), (last + 3, last + 2, last + 1, last)]
    return lpm._object(name, lpm._bm_from(verts, faces), P[colour])


parts.append(fore_loft("forecastle", DECK - 0.02, DECK + F_HEIGHT, 0.0, "hull_white"))
parts.append(fore_loft("balcony fore band", DECK + 0.07, DECK + 0.09, 0.006, "gold"))
parts.append(fore_loft("balcony fore top", DECK + F_HEIGHT, DECK + F_HEIGHT + 0.025, 0.02, "deck"))
FORE_RAIL_YS = [y + 0.03 for y in F_YS[1:-1]] + [F_BACK]
for side in (-1, 1):
    for y in FORE_RAIL_YS:
        parts.append(lpm.box("balcony fore post", (0.024, 0.024, 0.05), at=(side * (fore_width(y) - 0.02), y, DECK + F_HEIGHT + 0.025), color=P["hull_white"]))
    for y0, y1 in zip(FORE_RAIL_YS, FORE_RAIL_YS[1:]):
        rail = tk.strut(P, "wood_dark", (side * (fore_width(y0) - 0.02), y0, DECK + F_HEIGHT + 0.075), (side * (fore_width(y1) - 0.02), y1, DECK + F_HEIGHT + 0.075), radius=0.012, sides=4)
        rail.name = "balcony fore rail"
        parts.append(rail)
front = FORE_RAIL_YS[0]
front_rail = tk.strut(P, "wood_dark", (-(fore_width(front) - 0.02), front, DECK + F_HEIGHT + 0.075), (fore_width(front) - 0.02, front, DECK + F_HEIGHT + 0.075), radius=0.012, sides=4)
front_rail.name = "balcony fore rail"
parts.append(front_rail)
parts.append(lpm.prism("bell", 8, 0.045, 0.08, at=(0.2, -1.42, DECK + F_HEIGHT + 0.025), color=P["gold"], radius_top=0.025))
parts.append(tk.cyl_y(P, "wood_dark", 8, 0.06, -1.75, -1.55, DECK + F_HEIGHT + 0.085, name="windlass"))

BALCONY_YS = [-1.72, -1.84, -1.95, -2.05, -2.13, -2.19, -2.23]
BULWARK_TOP = DECK + 0.12
BALCONY_RAIL = DECK + 0.3
balcony_right = [(hull_side(y) + 0.012, y) for y in BALCONY_YS]
balcony_line = balcony_right + [(-x, y) for x, y in reversed(balcony_right)]


def bulwark_band(name, z0, z1, thickness, colour, grow=0.0):
    """A solid wall along the balcony line, from one side of the forecastle round the bow to the other."""
    verts, faces = [], []
    for x, y in balcony_line:
        sign = 1 if x > 0 else -1
        outer = (x + sign * grow, y - grow)
        inner = (x - sign * thickness, y + thickness)
        verts += [(outer[0], outer[1], z0), (outer[0], outer[1], z1), (inner[0], inner[1], z1), (inner[0], inner[1], z0)]
    for index in range(len(balcony_line) - 1):
        a, b = index * 4, (index + 1) * 4
        faces += [(a, a + 1, b + 1, b), (a + 1, a + 2, b + 2, b + 1), (a + 2, a + 3, b + 3, b + 2), (a + 3, a, b, b + 3)]
    last = (len(balcony_line) - 1) * 4
    faces += [(0, 1, 2, 3), (last, last + 1, last + 2, last + 3)]
    return lpm._object(name, lpm._bm_from(verts, faces), P[colour])


parts.append(lpm.sweep("balcony floor", balcony_line, 0.03, at=(0, 0, DECK - 0.01), color=P["deck"], axis="z"))
parts.append(bulwark_band("balcony bulwark", DECK - 0.01, BULWARK_TOP, 0.032, "hull_white"))
parts.append(bulwark_band("balcony trim", DECK + 0.05, DECK + 0.07, 0.01, "navy", grow=0.006))
parts.append(bulwark_band("balcony cap", BULWARK_TOP, BULWARK_TOP + 0.02, 0.04, "gold", grow=0.008))
for x, y in balcony_line:
    parts.append(lpm.box("balcony post", (0.024, 0.024, BALCONY_RAIL - BULWARK_TOP), at=(x, y + 0.012, BULWARK_TOP), color=P["hull_white"]))
for (x0, y0), (x1, y1) in zip(balcony_line, balcony_line[1:]):
    rail = tk.strut(P, "gold", (x0, y0 + 0.012, BALCONY_RAIL), (x1, y1 + 0.012, BALCONY_RAIL), radius=0.012, sides=4)
    rail.name = "balcony rail"
    parts.append(rail)

# Waist: rail, gratings, capstan, the ship's boat and stores.
parts.append(lpm.box("rudder", (0.09, 0.1, 0.42), at=(0, LENGTH / 2 + 0.02, 0.15), color=P["wood_dark"]))
for y, size in ((-0.3, 0.36), (0.42, 0.3)):
    parts.append(lpm.box("grating", (0.42, size, 0.05), at=(0, y, DECK), color=P["wood_dark"]))
    for offset in (-0.1, 0.0, 0.1):
        parts.append(lpm.box("grating bar", (0.36, 0.02, 0.008), at=(0, y + offset * size * 2.4, DECK + 0.05), color=P["deck_dark"]))
parts.append(lpm.prism("capstan", 8, 0.085, 0.16, at=(0, 0.92, DECK), color=P["wood"], radius_top=0.07))
parts.append(lpm.box("capstan bar", (0.34, 0.025, 0.025), at=(0, 0.92, DECK + 0.13), color=P["wood_dark"]))
parts.append(lpm.box("capstan bar", (0.025, 0.34, 0.025), at=(0, 0.92, DECK + 0.13), color=P["wood_dark"]))
for x, y in ((-0.38, -0.92), (-0.28, -1.02), (0.4, 0.86), (0.4, 1.02)):
    parts.append(lpm.prism("barrel", 8, 0.07, 0.15, at=(x, y, DECK), color=P["wood"], radius_top=0.065, rotate=22.5))
    parts.append(lpm.prism("barrel band", 8, 0.074, 0.018, at=(x, y, DECK + 0.05), color=P["iron"], rotate=22.5))
parts.append(lpm.box("crate", (0.17, 0.17, 0.14), at=(0.36, -0.95, DECK), color=P["deck_dark"]))
boat = lpm.sweep("ship's boat", tk.plan(0.62, 0.22, tk.HULL_STATIONS), 0.075, at=(0, 0, DECK + 0.05), color=P["hull_white"], axis="z")
inside = lpm.sweep("ship's boat inside", tk.plan(0.54, 0.16, tk.HULL_STATIONS), 0.008, at=(0, 0, DECK + 0.125), color=P["navy"], axis="z")
for part in (boat, inside):
    parts.append(lpm.move(part, 0.0, 0.05, 0.05))

for side in (-1, 1):
    for y in (-1.15, -0.8, -0.45, -0.1, 0.25, 0.6, 0.95):
        parts.append(lpm.box("rail post", (0.025, 0.025, 0.11), at=(side * hull_side(y, 0.94), y, DECK), color=P["hull_white"]))
    parts.append(lpm.box("rail", (0.028, 2.15, 0.022), at=(side * BEAM / 2 * 0.94, -0.1, DECK + 0.11), color=P["wood_dark"]))

parts.append(tk.strut(P, "wood_dark", (0, -1.85, DECK + 0.15), (0, -3.0, DECK + 0.7), radius=0.04, sides=8))
parts.append(lpm.prism("sprit cap", 8, 0.055, 0.06, at=(0, -3.0, DECK + 0.68), color=P["iron"]))
parts.append(tk.strut(P, "rope", (0, -3.0, DECK + 0.7), (0, -0.85, DECK + 1.9), radius=0.01))
parts.append(tk.sail(P, "sail", -1.55, DECK + 0.45, 1.1, 1.05, thickness=0.025, billow=0.1, side=True, shape="tri", flip=True, nx=6, nz=6, x=0.0))

for y, height, width in MASTS:
    parts.append(tk.mast(P, y, DECK, height, radius=0.04, color="wood_dark"))
    nest_z = DECK + height * 0.6
    parts.append(lpm.prism("top", 8, 0.1, 0.05, at=(0, y, nest_z), color=P["wood_dark"], radius_top=0.15))
    parts.append(lpm.lathe("truck", [(0, 0), (0.04, 0.02), (0.05, 0.05), (0, 0.09)], segments=8, at=(0, y, DECK + height), color=P["gold"]))
    for bottom, tall, scale in ((0.14, 0.4, 1.0), (0.58, 0.3, 0.74)):
        sail_z = DECK + height * bottom
        sail = tk.sail(P, "sail", y - 0.06, sail_z, width * scale, height * tall, thickness=0.03, billow=0.18, top_ratio=1.06, nx=6, nz=5)
        # The stripe is a row of the sail's own faces, so it billows with the cloth.
        if bottom < 0.5:
            lpm.paint(sail, P["navy"], where=lambda c, n, i: sail_z + height * tall * 0.4 < c.z < sail_z + height * tall * 0.6)
        parts.append(sail)
        parts.append(tk.beam_x(P, "wood_dark", y - 0.04, sail_z + height * tall, width * scale + 0.18, thickness=0.04))
    for side in (-1, 1):
        for dy in (-0.12, 0.12):
            parts.append(tk.strut(P, "rope", (side * 0.52, y + dy, DECK + 0.05), (0, y, nest_z), radius=0.008))

parts.append(tk.mast(P, 2.05, TOP, 0.75, radius=0.02, color="wood_dark"))

tk.shorten(parts, -1.0, 0.8, 0.5)
# The ensign stays out of shorten, which would slide its stripes apart.
parts.append(lpm.box("ensign", (0.02, 0.42, 0.25), at=(0, 2.05 - 0.25 + 0.23, TOP + 0.45), color=P["flag_red"]))
parts.append(lpm.box("ensign stripe", (0.024, 0.42, 0.07), at=(0, 2.05 - 0.25 + 0.23, TOP + 0.54), color=P["white"]))
# Guns, ports and thin balcony parts stay sharp: rounding them costs more than the budget has left.
for part in parts:
    if not part.name.startswith((*tk.PLAIN_PARTS, "balcony", "gun", "muzzle", "port")):
        kit.fillet(part, tk.FILLET, segments=1)
kit.build("NavyFrigate", parts, COLORS, tk.out_dir(__file__), budget=9000)
