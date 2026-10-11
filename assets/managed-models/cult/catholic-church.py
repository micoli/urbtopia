"""Stylized low-poly village church: lilac stone nave with timber framing, steep red gable roof, front bell tower with
timber belfry and red spire, apse, arched door and lancet windows. ~3.6 x 7 m footprint, budget 2 500 tris."""
import math, os, sys
sys.path.insert(0, "/Users/omichaud/.claude/skills/blender-lpm-skill/scripts")
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1]

lpm.reset()
P = lpm.Palette([
    ("stone", "#c3c0ea", 0.0, 0.9), ("stone_dark", "#9f9cc9", 0.0, 0.9),
    ("wood", "#c87d4a", 0.0, 0.85), ("wood_dark", "#97542e", 0.0, 0.85),
    ("roof", "#d9474b", 0.0, 0.8), ("roof_dark", "#b23439", 0.0, 0.8),
    ("window", "#4b4766", 0.0, 0.5), ("teal", "#3f9e7c", 0.0, 0.8), ("gold", "#e8b94a", 0.6, 0.4),
])
parts = []
def add(*objs): parts.extend(objs)

def arch(w, h, steps=(30, 60, 90, 120, 150), pointed=False):
    r = w / 2
    pts = [(-r, 0.0), (r, 0.0), (r, h - r)]
    if pointed:
        pts += [(r * 0.55, h - r * 0.35), (0.0, h), (-r * 0.55, h - r * 0.35)]
    else:
        pts += [(r * math.cos(math.radians(a)), h - r + r * math.sin(math.radians(a))) for a in steps]
    return pts + [(-r, h - r)]

def side_window(name, w, h, at):
    ob = lpm.sweep(name, arch(w, h, pointed=True), depth=0.08, at=at, color=P["window"], axis="y")
    return lpm.rotate(ob, 90, axis="Z", about=at) or ob

# --- plinth ---------------------------------------------------------------------------------------------------------
NW, NL, NH = 3.0, 4.6, 2.5       # nave width (x), length (y), eaves height
NY = 0.6                          # nave centre y
add(lpm.box("plinth", (NW + 0.3, NL + 0.3, 0.25), at=(0, NY, 0), color=P["stone_dark"]))
Z0 = 0.25

# --- nave: pentagon (gable) walls extruded along y ----------------------------------------------------------------------
GH = 1.7                          # gable height above eaves
add(lpm.sweep("nave", [(-NW / 2, 0), (NW / 2, 0), (NW / 2, NH), (0, NH + GH), (-NW / 2, NH)], depth=NL, at=(0, NY, Z0), color=P["stone"], axis="y"))

# roof: thick inverted V with overhang
OH, T = 0.35, 0.16
slope = GH / (NW / 2)
xo = NW / 2 + OH
zo = NH - OH * slope
roof = [(-xo, zo), (0, NH + GH + 0.02), (xo, zo), (xo, zo + T * 1.6), (0, NH + GH + 0.02 + T * 1.6), (-xo, zo + T * 1.6)]
add(lpm.sweep("roof", roof, depth=NL + 0.5, at=(0, NY + 0.1, Z0), color=P["roof"], axis="y"))
add(lpm.box("ridge", (0.22, NL + 0.5, 0.14), at=(0, NY + 0.1, Z0 + NH + GH + T * 1.6 - 0.04), color=P["roof_dark"]))

# timber frame on the long walls: posts, sill and top beams, diagonal braces
for sx in (-1, 1):
    x = sx * (NW / 2 + 0.03)
    for y in (-1.6, -0.45, 0.65, 1.75, 2.85):
        add(lpm.box(f"post{sx}{y:+.1f}", (0.1, 0.16, NH - 0.05), at=(x, NY + y - 0.6, Z0), color=P["wood"]))
    add(lpm.box(f"beam_top{sx}", (0.1, NL + 0.05, 0.16), at=(x, NY, Z0 + NH - 0.16), color=P["wood_dark"]))
    add(lpm.box(f"beam_mid{sx}", (0.08, NL, 0.12), at=(x, NY, Z0 + 0.9), color=P["wood"]))
    for y in (-1.6, 1.75):
        b = lpm.box(f"brace{sx}{y:+.1f}", (0.07, 0.12, 1.5), at=(x, NY + y - 0.6 + 0.55, Z0 + 0.95), color=P["wood"])
        lpm.rotate(b, sx * 38 if y < 0 else -sx * 38, axis="X", about=(x, NY + y - 0.6 + 0.55, Z0 + 1.6))
        add(b)
    # lancet windows between posts
    for y in (-0.47, 1.73):
        add(side_window(f"win{sx}{y:+.1f}", 0.44, 1.0, (sx * (NW / 2 + 0.01), NY + y + 0.08, Z0 + 1.15)))

# rear gable timber triangle
GY = NY + NL / 2 + 0.03
add(lpm.box("gable_beam", (NW, 0.1, 0.16), at=(0, GY, Z0 + NH - 0.16), color=P["wood_dark"]))
add(lpm.box("gable_post", (0.14, 0.1, GH - 0.1), at=(0, GY, Z0 + NH), color=P["wood"]))
add(lpm.sweep("rose", [(0.28 * math.cos(math.radians(a)), 0.28 * math.sin(math.radians(a))) for a in range(0, 360, 45)], depth=0.06, at=(0, GY + 0.02, Z0 + NH + 0.6), color=P["teal"], axis="y"))

# --- apse at the back ----------------------------------------------------------------------------------------------------
AY = NY + NL / 2
add(lpm.prism("apse", 8, 1.05, 1.7, at=(0, AY, Z0), color=P["stone"], rotate=22.5))
add(lpm.prism("apse_roof", 8, 1.25, 0.9, at=(0, AY, Z0 + 1.7 - 0.02), color=P["roof"], radius_top=0.25, rotate=22.5))
add(lpm.prism("apse_base", 8, 1.09, 0.3, at=(0, AY, Z0 - 0.01), color=P["stone_dark"], rotate=22.5))

# --- front bell tower ------------------------------------------------------------------------------------------------------
TW = 1.7
TY = NY - NL / 2 - TW / 2 + 0.25
TS = 4.3                          # stone part height
add(lpm.box("tower_base", (TW + 0.12, TW + 0.12, 0.4), at=(0, TY, Z0 - 0.01), color=P["stone_dark"]))
add(lpm.box("tower", (TW, TW, TS), at=(0, TY, Z0), color=P["stone"]))
for sx in (-1, 1):
    for sy in (-1, 1):
        add(lpm.box(f"tcorner{sx}{sy}", (0.16, 0.16, TS - 0.3), at=(sx * TW / 2, TY + sy * TW / 2, Z0 + 0.3), color=P["stone_dark"]))
add(lpm.box("tower_band", (TW + 0.14, TW + 0.14, 0.18), at=(0, TY, Z0 + TS - 0.1), color=P["wood_dark"]))

# door: wooden arched door in a stone frame, small porch roof
FY = TY - TW / 2
add(lpm.sweep("door_frame", arch(1.0, 1.65), depth=0.1, at=(0, FY - 0.03, Z0), color=P["stone_dark"], axis="y"))
add(lpm.sweep("door", arch(0.76, 1.48), depth=0.1, at=(0, FY - 0.07, Z0), color=P["wood_dark"], axis="y"))
add(lpm.box("door_plank", (0.05, 0.04, 1.3), at=(0, FY - 0.12, Z0), color=P["wood"]))
add(lpm.sweep("tw_front", arch(0.34, 0.75, pointed=True), depth=0.08, at=(0, FY - 0.01, Z0 + 2.8), color=P["window"], axis="y"))
for sx in (-1, 1):
        add(side_window(f"tw_side{sx}", 0.3, 0.65, (sx * (TW / 2 + 0.01), TY, Z0 + 2.9)))

# banner above the door
add(lpm.sweep("banner", [(-0.2, 0.0), (0.2, 0.0), (0.2, -0.55), (0.0, -0.42), (-0.2, -0.55)], depth=0.04, at=(0, FY - 0.04, Z0 + 2.45), color=P["teal"], axis="y"))
add(lpm.box("banner_rod", (0.55, 0.06, 0.06), at=(0, FY - 0.06, Z0 + 2.44), color=P["wood_dark"]))

# timber belfry: corner posts, rails, open arches showing a dark interior and a bell
BZ = Z0 + TS + 0.08
BH = 1.15
add(lpm.box("belfry_core", (TW - 0.35, TW - 0.35, BH), at=(0, TY, BZ), color=P["window"]))
add(lpm.box("belfry_floor", (TW + 0.1, TW + 0.1, 0.12), at=(0, TY, BZ - 0.02), color=P["wood"]))
for sx in (-1, 1):
    for sy in (-1, 1):
        add(lpm.box(f"bpost{sx}{sy}", (0.18, 0.18, BH), at=(sx * (TW / 2 - 0.05), TY + sy * (TW / 2 - 0.05), BZ), color=P["wood"]))
add(lpm.box("belfry_rail", (TW + 0.04, TW + 0.04, 0.12), at=(0, TY, BZ + 0.35), color=P["wood_dark"]))
add(lpm.box("belfry_top", (TW + 0.14, TW + 0.14, 0.16), at=(0, TY, BZ + BH - 0.04), color=P["wood_dark"]))
add(lpm.lathe("bell", [(0.0, 0.0), (0.26, 0.0), (0.2, 0.15), (0.16, 0.4), (0.08, 0.48), (0.0, 0.5)], segments=8, at=(0, TY, BZ + 0.45), color=P["gold"]))

# spire with flared eaves and a cross
SZ = BZ + BH + 0.1
add(lpm.prism("spire_eave", 4, (TW + 0.5) / math.sqrt(2), 0.45, at=(0, TY, SZ - 0.02), color=P["roof"], radius_top=TW / math.sqrt(2) * 0.72, rotate=45))
add(lpm.prism("spire", 4, TW * 0.72 / math.sqrt(2), 2.6, at=(0, TY, SZ + 0.4), color=P["roof"], radius_top=0.02, rotate=45))
CZ = SZ + 0.4 + 2.5
add(lpm.box("cross_v", (0.08, 0.08, 0.75), at=(0, TY, CZ), color=P["gold"]))
add(lpm.box("cross_h", (0.4, 0.08, 0.08), at=(0, TY, CZ + 0.45), color=P["gold"]))

church = lpm.finish("Church", parts, P, budget=2500)
lpm.export_unity(church, OUT, glb=True)
