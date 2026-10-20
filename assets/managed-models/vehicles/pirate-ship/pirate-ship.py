"""Pirate galleon: rounded wooden hull, castles with railings, three masts with billowed sails and shrouds, skull flag, glowing stern windows, bow at -Y."""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("wood", "#8a5530"), ("wood_dark", "#5a331b"), ("wood_light", "#b57a45"), ("sail", "#efe6cf"), ("flag", "#1b1a20"), ("gold", "#ffcf3a"), ("rope", "#b9a57a"), ("iron", "#3a3a44")]
P = kit.palette(COLORS)

LENGTH, BEAM = 5.0, 1.5
STATIONS = [(0.0, 0.0), (0.02, 0.3), (0.05, 0.5), (0.1, 0.68), (0.18, 0.84), (0.28, 0.94), (0.4, 1.0), (0.7, 1.0), (0.85, 0.95), (0.95, 0.84), (1.0, 0.7)]
BANDS = [(0.55, 0.78, "wood_dark"), (0.76, 0.9, "wood_dark"), (0.92, 0.96, "wood"), (1.0, 1.0, "wood"), (1.0, 1.0, "wood"), (0.96, 1.0, "wood"), (0.9, 1.0, "wood_dark")]
BAND_H = 0.1
DECK = BAND_H * len(BANDS)
MASTS = ((-0.9, 2.3, 1.1), (0.15, 2.8, 1.3), (1.6, 2.0, 0.95))
FORE_Y = -1.7


def rail_along_y(x, y0, y1, z, gap=0.22):
    parts = [lpm.box("rail top", (0.03, y1 - y0, 0.03), at=(x, (y0 + y1) / 2, z + 0.1), color=P["wood_dark"])]
    for i in range(int((y1 - y0) / gap) + 1):
        parts.append(lpm.box("rail post", (0.035, 0.035, 0.11), at=(x, y0 + i * gap, z), color=P["wood_dark"]))
    return parts


def rail_along_x(y, x0, x1, z, gap=0.22):
    parts = [lpm.box("rail top", (x1 - x0, 0.03, 0.03), at=((x0 + x1) / 2, y, z + 0.1), color=P["wood_dark"])]
    for i in range(int((x1 - x0) / gap) + 1):
        parts.append(lpm.box("rail post", (0.035, 0.035, 0.11), at=(x0 + i * gap, y, z), color=P["wood_dark"]))
    return parts


def arched_window(x, y, z, facing, width=0.15, height=0.2):
    """Glowing arched window with a dark frame; facing is '+y', '-y', '+x' or '-x'."""
    parts = []
    for scale, colour, depth in ((1.35, "wood_dark", 0.025), (1.0, "gold", 0.04)):
        w, h = width * scale / 2, height * scale
        outline = [(-w, 0), (w, 0), (w, h * 0.7), (w * 0.5, h * 0.95), (-w * 0.5, h * 0.95), (-w, h * 0.7)]
        part = lpm.sweep("arch window", outline, depth, at=(x, y, z - (scale - 1) * height / 2), color=P[colour], axis="y")
        angle = {"+y": 0, "-y": 180, "+x": -90, "-x": 90}[facing]
        parts.append(lpm.rotate(part, angle, "Z", about=(x, y, z)) if angle else part)
    return parts


def flag_banner(y, z, length=0.7, height=0.42):
    cloth = lpm.grid_box("flag", (length, 0.025, height), color=P["flag"], nx=8, nz=4)
    for v in cloth.data.vertices:
        u = v.co.x / length + 0.5
        v.co.y += 0.07 * math.sin(2 * math.pi * 1.25 * u) * u
        if u > 0.99 and abs(v.co.z / height - 0.5) < 0.01:
            v.co.x -= length * 0.2
    cloth.data.update()
    lpm.rotate(cloth, 90, "Z")
    parts = [lpm.move(cloth, 0, y + length / 2, z)]
    yc, zc = y + length * 0.42, z + height / 2
    for side in (-1, 1):
        x = side * 0.02
        parts += [
            lpm.box("skull", (0.02, 0.12, 0.1), at=(x, yc, zc - 0.005), color=P["white"]),
            lpm.box("skull jaw", (0.02, 0.07, 0.04), at=(x, yc, zc - 0.04), color=P["white"]),
            lpm.box("eye", (0.022, 0.028, 0.03), at=(x, yc - 0.028, zc + 0.01), color=P["flag"]),
            lpm.box("eye", (0.022, 0.028, 0.03), at=(x, yc + 0.028, zc + 0.01), color=P["flag"]),
        ]
        for angle in (35, -35):
            bone = lpm.box("bone", (0.018, 0.24, 0.028), at=(x * 0.85, yc, zc - 0.095), color=P["white"])
            parts.append(lpm.rotate(bone, angle, "X", about=(x * 0.85, yc, zc - 0.08)))
    return parts


parts = []
for i, (beam_k, length_k, colour) in enumerate(BANDS):
    band = lpm.sweep(f"hull band {i}", tk.plan(LENGTH * length_k, BEAM * beam_k, STATIONS), BAND_H, at=(0, 0, i * BAND_H), color=P[colour], axis="z")
    if i == len(BANDS) - 1:
        lpm.paint(band, P["wood_dark"], where=lambda c, n, j: n.z > 0.5)
    parts.append(band)
parts.append(lpm.sweep("deck", tk.plan(LENGTH * 0.92, BEAM * 0.8, STATIONS), 0.03, at=(0, 0, DECK - 0.01), color=P["wood_light"], axis="z"))
for z in (0.3, 0.5, 0.66):
    parts += kit.panel("plank line", P, "wood_dark", -1.7, 1.6, z, z + 0.025, BEAM / 2 * 1.01)
for z, count, y0, y1, half in ((0.36, 5, -1.5, 1.2, 0.75), (0.55, 4, -1.4, 1.1, 0.745)):
    parts += tk.window_row(P, "wood_dark", y0, y1, z - 0.03, half, count, height=0.13, gap=0.25)
    parts += tk.window_row(P, "black", y0, y1, z, half + 0.012, count, height=0.07, gap=0.5)

CASTLE_TOP = [(0.8, 0.04), (0.95, 0.3), (1.55, 0.3), (1.7, 0.55), (2.62, 0.55)]
CASTLE_Y = [0.8, 0.95, 1.25, 1.55, 1.7, 1.75, 2.0, 2.25, 2.5, 2.62]


def lerp_table(table, y):
    for (y0, v0), (y1, v1) in zip(table, table[1:]):
        if y <= y1:
            return v0 + (v1 - v0) * (y - y0) / (y1 - y0)
    return table[-1][1]


def castle_top(y):
    return lerp_table(CASTLE_TOP, y)


def hull_half_width(y, k=0.0):
    """Half beam of the hull side at y, leaning in by 10 % towards the top (tumblehome)."""
    t = min(max((y + LENGTH / 2) / LENGTH, 0.0), 1.0)
    width = lerp_table([(t0, w) for t0, w in STATIONS], t) if t > 0 else 0.0
    return BEAM / 2 * 0.92 * width * (1 - 0.1 * k)


def castle_loft(name, k0, k1, out, colour, ys=None, table=None):
    """Raised deck lofted along y so its sides follow the hull width; `table` gives the roof height above the deck at each y."""
    ys, table = ys or CASTLE_Y, table or CASTLE_TOP
    z_floor = DECK - 0.02
    verts, faces = [], []
    for y in ys:
        top = DECK + lerp_table(table, y)
        z0, z1 = z_floor + (top - z_floor) * k0, z_floor + (top - z_floor) * k1
        w0, w1 = hull_half_width(y, k0) + out, hull_half_width(y, k1) + out
        verts += [(-w0, y, z0), (w0, y, z0), (w1, y, z1), (-w1, y, z1)]
    n = len(ys)
    for i in range(n - 1):
        a, b = i * 4, (i + 1) * 4
        faces += [(a + 1, b + 1, b + 2, a + 2), (a, a + 3, b + 3, b), (a + 3, a + 2, b + 2, b + 3), (a, b, b + 1, a + 1)]
    faces += [(0, 1, 2, 3), ((n - 1) * 4 + 3, (n - 1) * 4 + 2, (n - 1) * 4 + 1, (n - 1) * 4)]
    return lpm._object(name, lpm._bm_from(verts, faces), P[colour])


castle = castle_loft("stern castle", 0.0, 1.0, 0.0, "wood")
lpm.paint(castle, P["wood_light"], where=lambda c, n, i: n.z > 0.7)
parts.append(castle)
parts.append(castle_loft("stern trim", 0.36, 0.5, 0.014, "wood_dark"))
parts.append(castle_loft("stern cap", 0.93, 1.0, 0.035, "wood_dark"))
for x in (-0.3, 0.0, 0.3):
    parts += arched_window(x, 2.62, DECK + 0.07, "+y")
for side in (-1, 1):
    for y in (1.9, 2.25):
        parts += arched_window(side * (hull_half_width(y, 0.3) + 0.004), y, DECK + 0.09, "+x" if side > 0 else "-x")
    posts = [y / 100 for y in range(100, 256, 20)]
    for y in posts:
        parts.append(lpm.box("rail post", (0.035, 0.035, 0.11), at=(side * (hull_half_width(y, 1.0) - 0.04), y, DECK + castle_top(y)), color=P["wood_dark"]))
    for y0, y1 in zip(posts, posts[1:]):
        p0 = (side * (hull_half_width(y0, 1.0) - 0.04), y0, DECK + castle_top(y0) + 0.11)
        p1 = (side * (hull_half_width(y1, 1.0) - 0.04), y1, DECK + castle_top(y1) + 0.11)
        parts.append(tk.strut(P, "wood_dark", p0, p1, radius=0.016))
parts += rail_along_x(2.56, -hull_half_width(2.56, 1.0) + 0.04, hull_half_width(2.56, 1.0) - 0.04, DECK + 0.55)
parts += rail_along_x(1.74, -hull_half_width(1.74, 1.0) + 0.04, hull_half_width(1.74, 1.0) - 0.04, DECK + 0.55)
parts += rail_along_x(0.98, -hull_half_width(0.98, 1.0) + 0.04, hull_half_width(0.98, 1.0) - 0.04, DECK + 0.3)
parts.append(lpm.box("helm post", (0.08, 0.08, 0.14), at=(0, 2.05, DECK + 0.55), color=P["wood_dark"]))
parts.append(tk.cyl_y(P, "wood_light", 10, 0.11, 2.03, 2.07, DECK + 0.78, name="helm wheel"))
parts.append(tk.cyl_y(P, "wood_dark", 6, 0.04, 2.01, 2.1, DECK + 0.78, name="helm hub"))
parts.append(lpm.box("lantern", (0.07, 0.07, 0.14), at=(0.4, 2.45, DECK + 0.55), color=P["gold"]))

FORE_TOP = [(-2.46, 0.32), (-1.3, 0.32), (-1.02, 0.04)]
FORE_YS = [-2.46, -2.42, -2.36, -2.28, -2.18, -2.06, -1.9, -1.7, -1.5, -1.3, -1.02]
fore = castle_loft("fore castle", 0.0, 1.0, 0.0, "wood", FORE_YS, FORE_TOP)
lpm.paint(fore, P["wood_light"], where=lambda c, n, i: n.z > 0.7)
parts.append(fore)
parts.append(castle_loft("fore trim", 0.36, 0.5, 0.014, "wood_dark", FORE_YS, FORE_TOP))
parts.append(castle_loft("fore cap", 0.93, 1.0, 0.035, "wood_dark", FORE_YS, FORE_TOP))
RAIL_YS = [-2.42, -2.34, -2.24, -2.12, -1.98, -1.82, -1.66, -1.5, -1.3]
for side in (-1, 1):
    for y in (-1.8, -1.5):
        x = side * (hull_half_width(y, 0.3) + 0.002)
        parts.append(lpm.box("window frame", (0.03, 0.2, 0.16), at=(x, y, DECK + 0.06), color=P["wood_dark"]))
        parts.append(lpm.box("window port", (0.034, 0.12, 0.09), at=(x + side * 0.008, y, DECK + 0.095), color=P["black"]))
    posts = RAIL_YS
    for y in posts:
        parts.append(lpm.box("rail post", (0.035, 0.035, 0.11), at=(side * (hull_half_width(y, 1.0) - 0.04), y, DECK + 0.32), color=P["wood_dark"]))
    for y0, y1 in zip(posts, posts[1:]):
        parts.append(tk.strut(P, "wood_dark", (side * (hull_half_width(y0, 1.0) - 0.04), y0, DECK + 0.43), (side * (hull_half_width(y1, 1.0) - 0.04), y1, DECK + 0.43), radius=0.016))
parts.append(tk.strut(P, "wood_dark", (-(hull_half_width(RAIL_YS[0], 1.0) - 0.04), RAIL_YS[0], DECK + 0.43), (hull_half_width(RAIL_YS[0], 1.0) - 0.04, RAIL_YS[0], DECK + 0.43), radius=0.016))
parts += rail_along_x(-1.3, -hull_half_width(-1.3, 1.0) + 0.04, hull_half_width(-1.3, 1.0) - 0.04, DECK + 0.32)

STEM = [(-1.97, 0.0), (-2.27, 0.1), (-2.42, 0.2), (-2.52, 0.3), (-2.54, 0.45), (-2.58, 0.6), (-2.7, DECK + 0.16)]
for (y0, z0), (y1, z1) in zip(STEM, STEM[1:]):
    parts.append(tk.strut(P, "wood_dark", (0, y0, z0), (0, y1, z1), radius=0.045, sides=6))
parts.append(lpm.sweep("beakhead", [(-0.2, -2.32), (0.2, -2.32), (0.1, -2.72), (-0.1, -2.72)], 0.05, at=(0, 0, DECK + 0.08), color=P["wood_dark"], axis="z"))
for side in (-1, 1):
    parts.append(tk.strut(P, "wood_dark", (side * 0.17, -2.3, DECK + 0.1), (side * 0.07, -2.7, DECK + 0.1), radius=0.02))
parts.append(lpm.box("rudder", (0.1, 0.1, 0.45), at=(0, LENGTH / 2 + 0.02, 0.15), color=P["wood_dark"]))

SPRIT_BASE, SPRIT_TIP = (0, -2.0, DECK + 0.32), (0, -3.3, DECK + 1.0)
parts.append(tk.strut(P, "wood_dark", SPRIT_BASE, SPRIT_TIP, radius=0.05, sides=8))
parts.append(lpm.box("sprit block", (0.22, 0.3, 0.12), at=(0, -2.12, DECK + 0.3), color=P["wood_dark"]))
parts.append(tk.strut(P, "wood_dark", (0, -2.66, DECK + 0.14), (0, -2.92, DECK + 0.76), radius=0.03))
parts.append(lpm.prism("sprit ring", 8, 0.07, 0.05, at=(0, -2.6, DECK + 0.57), color=P["iron"]))
parts.append(lpm.prism("sprit cap", 8, 0.065, 0.07, at=(0, -3.3, DECK + 0.98), color=P["iron"]))
parts.append(tk.strut(P, "rope", SPRIT_TIP, (0, -0.95, DECK + 2.1), radius=0.01))
parts.append(tk.sail(P, "sail", -1.65, DECK + 0.55, 1.3, 1.2, thickness=0.025, billow=0.12, side=True, shape="tri", flip=True, nx=6, nz=6, x=0.0))

for y, h, w in MASTS:
    parts.append(tk.mast(P, y, DECK, h, radius=0.04, color="wood_dark"))
    nest_z = DECK + h * 0.62
    parts.append(lpm.prism("crow nest", 8, 0.12, 0.13, at=(0, y, nest_z), color=P["wood_dark"], radius_top=0.17))
    parts.append(lpm.prism("crow nest rim", 8, 0.185, 0.03, at=(0, y, nest_z + 0.13), color=P["wood"], radius_top=0.185))
    parts.append(lpm.lathe("finial", [(0, 0), (0.05, 0.02), (0.06, 0.06), (0.04, 0.1), (0, 0.12)], segments=8, at=(0, y, DECK + h), color=P["wood_light"]))
    for zf, hf, wf in ((0.12, 0.38, 1.0), (0.55, 0.3, 0.75)):
        sail_z = DECK + h * zf
        parts.append(tk.sail(P, "sail", y - 0.06, sail_z, w * wf, h * hf, thickness=0.03, billow=0.2, top_ratio=1.08, nx=6, nz=5))
        yard_w = w * wf + 0.2
        parts.append(tk.beam_x(P, "wood_dark", y - 0.04, sail_z + h * hf, yard_w, thickness=0.045))
        for side in (-1, 1):
            parts.append(lpm.box("yard band", (0.06, 0.06, 0.06), at=(side * (yard_w / 2 - 0.02), y - 0.04, sail_z + h * hf - 0.0), color=P["iron"]))
    for side in (-1, 1):
        top = (0, y, nest_z - 0.02)
        for dy in (-0.14, 0.14):
            parts.append(tk.strut(P, "rope", (side * 0.56, y + dy, DECK + 0.05), top, radius=0.008))
        for t in (0.2, 0.4, 0.6):
            x = side * 0.56 * (1 - t)
            parts.append(lpm.box("strut rung", (0.012, 0.28 * (1 - t), 0.012), at=(x, y, DECK + 0.05 + (nest_z - DECK - 0.07) * t), color=P["rope"]))

POLE_TOP = DECK + 2.8 + 0.35
parts.append(tk.mast(P, 0.15, DECK + 2.8, 0.35, radius=0.022, color="wood_dark"))
parts += flag_banner(0.15, POLE_TOP - 0.48)

parts += rail_along_y(0.58, -1.2, 0.95, DECK + 0.02)
parts += rail_along_y(-0.58, -1.2, 0.95, DECK + 0.02)
for side in (-1, 1):
    for y in (-0.6, -0.1, 0.4):
        parts.append(lpm.box("cannon", (0.1, 0.2, 0.08), at=(side * 0.48, y, DECK + 0.03), color=P["iron"]))
        parts.append(lpm.box("cannon wheel", (0.12, 0.07, 0.04), at=(side * 0.48, y + 0.04, DECK), color=P["wood_dark"]))
parts.append(lpm.box("hatch", (0.5, 0.42, 0.08), at=(0, -0.38, DECK), color=P["wood_dark"]))
parts.append(lpm.box("hatch grating", (0.38, 0.3, 0.02), at=(0, -0.38, DECK + 0.08), color=P["iron"]))
for x, y in ((-0.38, 0.75), (-0.2, 0.9), (0.38, 0.8)):
    parts.append(lpm.prism("barrel", 8, 0.1, 0.2, at=(x, y, DECK), color=P["wood"], radius_top=0.095, rotate=22.5))
    parts.append(lpm.prism("barrel band", 8, 0.104, 0.03, at=(x, y, DECK + 0.05), color=P["iron"], rotate=22.5))
    parts.append(lpm.prism("barrel band", 8, 0.104, 0.03, at=(x, y, DECK + 0.13), color=P["iron"], rotate=22.5))
parts.append(lpm.box("crate", (0.22, 0.22, 0.2), at=(0.3, 0.95, DECK), color=P["wood_light"]))
parts.append(lpm.box("chest", (0.3, 0.2, 0.12), at=(-0.25, 2.3, DECK + 0.55), color=P["wood_dark"]))
parts.append(lpm.box("chest lid", (0.3, 0.2, 0.05), at=(-0.25, 2.3, DECK + 0.67), color=P["gold"], taper=(0.9, 0.8)))
parts.append(tk.strut(P, "iron", (0.52, FORE_Y + 0.45, DECK + 0.02), (0.52, FORE_Y + 0.45, DECK + 0.3), radius=0.018))
parts.append(lpm.box("anchor arm", (0.2, 0.025, 0.025), at=(0.52, FORE_Y + 0.45, DECK + 0.04), color=P["iron"]))
parts.append(lpm.box("anchor ring", (0.07, 0.025, 0.025), at=(0.52, FORE_Y + 0.45, DECK + 0.29), color=P["iron"]))

tk.shorten(parts, -1.0, 0.8, 0.6)
tk.build("PirateShip", parts, COLORS, tk.out_dir(__file__), budget=12000)
