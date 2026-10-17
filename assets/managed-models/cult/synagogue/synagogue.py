"""Stylized low-poly village synagogue: lilac stone hall with timber framing and a tiered red hipped roof, front gable
with a round window bearing a Star of David, Tablets of the Law on the apex, two flanking towers with teal onion
domes, round-arched door and windows. Budget 3 000 tris."""
import math, os, sys
import bpy
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "tools", "blender"))
import lpm

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[argv.index("--out") + 1]

lpm.reset()
P = lpm.Palette([
    ("stone", "#b8b6e4", 0.0, 0.85), ("stone_dark", "#8e8bc2", 0.0, 0.85),
    ("wood", "#c97a47", 0.0, 0.85), ("wood_dark", "#97532f", 0.0, 0.85),
    ("roof", "#d8484d", 0.0, 0.8), ("roof_dark", "#b3363b", 0.0, 0.8),
    ("window", "#3d3956", 0.0, 0.5), ("teal", "#4aa685", 0.0, 0.8), ("gold", "#e8b94a", 0.5, 0.4),
])
parts = []
def add(*objs): parts.extend(objs)

def arch(w, h, n=5):
    r = w / 2
    return [(-r, 0.0), (r, 0.0), (r, h - r)] + [(r * math.cos(math.pi * i / (n + 1)), h - r + r * math.sin(math.pi * i / (n + 1))) for i in range(1, n + 1)] + [(-r, h - r)]

def front(name, outline, at, color, depth=0.08):
    return lpm.sweep(name, outline, depth=depth, at=at, color=P[color], axis="y")

def side(name, outline, at, color, depth=0.08):
    return lpm.rotate(front(name, outline, at, color, depth), 90, axis="Z", about=at)

def circle(r, n=12, ox=0.0, oz=0.0):
    return [(ox + r * math.cos(2 * math.pi * i / n), oz + r * math.sin(2 * math.pi * i / n)) for i in range(n)]

def star(r, oz=0.0):
    pts = []
    for i in range(12):
        rr = r if i % 2 == 0 else r / math.sqrt(3)
        a = math.pi / 2 + math.pi * i / 6
        pts.append((rr * math.cos(a), oz + rr * math.sin(a)))
    return pts

def onion(name, r, at, segments=8):
    prof = [(r, 0.0), (r * 1.25, r * 0.45), (r * 1.1, r * 0.95), (r * 0.6, r * 1.4), (r * 0.18, r * 1.75), (0.0, r * 2.0)]
    return lpm.lathe(name, prof, segments=segments, at=at, color=P["teal"])

# --- plinth ------------------------------------------------------------------------------------------------------------
HW, HL, HH = 4.4, 5.0, 2.9
HY = 0.4
add(lpm.box("plinth", (HW + 0.5, HL + 0.9, 0.25), at=(0, HY - 0.2, 0), color=P["stone_dark"]))
add(lpm.box("step", (1.8, 0.5, 0.13), at=(0, HY - HL / 2 - 1.0, 0), color=P["stone_dark"]))
Z0 = 0.25

# --- hall with timber framing ------------------------------------------------------------------------------------------
add(lpm.box("hall", (HW, HL, HH), at=(0, HY, Z0), color=P["stone"]))
add(lpm.box("hall_base", (HW + 0.08, HL + 0.08, 0.35), at=(0, HY, Z0 - 0.01), color=P["stone_dark"]))
add(lpm.box("eave_beam", (HW + 0.12, HL + 0.12, 0.18), at=(0, HY, Z0 + HH - 0.18), color=P["wood_dark"]))
for sx in (-1, 1):
    x = sx * (HW / 2 + 0.03)
    for y in (-2.05, -0.7, 0.7, 2.05):
        add(lpm.box(f"post{sx}{y:+.1f}", (0.1, 0.16, HH - 0.3), at=(x, HY + y, Z0 + 0.3), color=P["wood"]))
    add(lpm.box(f"beam_mid{sx}", (0.08, HL, 0.12), at=(x, HY, Z0 + 0.95), color=P["wood"]))
    for y in (-1.38, 0.0, 1.38):
        add(side(f"win{sx}{y:+.1f}", arch(0.55, 1.35), (sx * (HW / 2 + 0.01), HY + y, Z0 + 1.15), "window"))
for x in (-1.2, 0.0, 1.2):
    add(front(f"winb{x:+.1f}", arch(0.55, 1.35), (x, HY + HL / 2 + 0.01, Z0 + 1.15), "window"))

# --- tiered hipped roof ------------------------------------------------------------------------------------------------
RZ = Z0 + HH - 0.05
add(lpm.box("roof_low", (HW + 0.8, HL + 0.8, 1.1), at=(0, HY + 0.2, RZ), color=P["roof"], taper=(0.62, 0.7)))
add(lpm.box("roof_step", (HW * 0.62 + 0.3, (HL + 0.8) * 0.7 - 0.2, 0.35), at=(0, HY + 0.2, RZ + 1.05), color=P["wood_dark"]))
add(lpm.box("roof_high", (HW * 0.62 + 0.5, (HL + 0.8) * 0.7, 1.15), at=(0, HY + 0.2, RZ + 1.38), color=P["roof"], taper=(0.12, 0.45)))
add(lpm.box("ridge", (0.2, (HL + 0.8) * 0.7 * 0.45 + 0.1, 0.12), at=(0, HY + 0.2, RZ + 2.48), color=P["roof_dark"]))

# --- front gable facade ------------------------------------------------------------------------------------------------
FY = HY - HL / 2
GW, GH, GT = 2.6, 1.6, 0.5         # gable width, peak above eaves, depth
add(front("facade", [(-GW / 2, 0), (GW / 2, 0), (GW / 2, HH + 0.4), (0, HH + 0.4 + GH), (-GW / 2, HH + 0.4)], (0, FY - GT / 2 + 0.05, Z0), "stone", depth=GT))
slope = GH / (GW / 2)
cap = [(-GW / 2 - 0.15, HH + 0.4 - 0.15 * slope), (0, HH + 0.4 + GH + 0.04), (GW / 2 + 0.15, HH + 0.4 - 0.15 * slope),
       (GW / 2 + 0.15, HH + 0.4 - 0.15 * slope + 0.2), (0, HH + 0.4 + GH + 0.24), (-GW / 2 - 0.15, HH + 0.4 - 0.15 * slope + 0.2)]
add(front("gable_cap", cap, (0, FY - GT / 2 + 0.05, Z0), "wood_dark", depth=GT + 0.12))
FF = FY - GT + 0.05
add(front("door_frame", arch(1.3, 2.05), (0, FF - 0.02, Z0), "stone_dark"))
add(front("door", arch(1.0, 1.85), (0, FF - 0.06, Z0), "wood"))
add(lpm.box("door_split", (0.05, 0.04, 1.65), at=(0, FF - 0.11, Z0), color=P["wood_dark"]))
RW = Z0 + 2.65
add(front("rose_ring", circle(0.62, 12), (0, FF - 0.02, RW), "wood_dark"))
add(front("rose", circle(0.52, 12), (0, FF - 0.05, RW), "window"))
add(front("star", star(0.42), (0, FF - 0.09, RW), "gold"))
TZ = Z0 + HH + 0.4 + GH + 0.2
tablet = arch(0.26, 0.5, n=3)
for sx in (-1, 1):
    add(front(f"tablet{sx}", [(x + sx * 0.15, z) for x, z in tablet], (0, FY - GT / 2 + 0.05, TZ - 0.04), "stone", depth=0.12))
    add(front(f"tablet_rim{sx}", [(x * 1.18 + sx * 0.15, z * 1.08 - 0.02) for x, z in tablet], (0, FY - GT / 2 + 0.06, TZ - 0.04), "gold", depth=0.08))

# --- flanking towers with onion domes ----------------------------------------------------------------------------------
TW, TH = 1.0, 4.5
for sx in (-1, 1):
    tx, ty = sx * (GW / 2 + TW / 2 - 0.05), FY - 0.15
    add(lpm.box(f"tower{sx}", (TW, TW, TH), at=(tx, ty, Z0), color=P["stone"]))
    add(lpm.box(f"tower_base{sx}", (TW + 0.1, TW + 0.1, 0.45), at=(tx, ty, Z0 - 0.01), color=P["stone_dark"]))
    add(lpm.box(f"tower_band{sx}", (TW + 0.08, TW + 0.08, 0.14), at=(tx, ty, Z0 + 2.4), color=P["teal"]))
    add(lpm.box(f"tower_cornice{sx}", (TW + 0.18, TW + 0.18, 0.18), at=(tx, ty, Z0 + TH - 0.06), color=P["wood_dark"]))
    for z in (1.0, 2.85):
        add(front(f"twin{sx}{z}", arch(0.3, 0.75), (tx, ty - TW / 2 - 0.01, Z0 + z), "window"))
    add(side(f"twins{sx}", arch(0.3, 0.75), (tx + sx * (TW / 2 + 0.01), ty, Z0 + 2.85), "window"))
    add(lpm.prism(f"tdrum{sx}", 8, 0.42, 0.35, at=(tx, ty, Z0 + TH + 0.1), color=P["stone"], rotate=22.5))
    add(onion(f"tdome{sx}", 0.38, (tx, ty, Z0 + TH + 0.43)))
    add(lpm.prism(f"tspike{sx}", 6, 0.03, 0.35, at=(tx, ty, Z0 + TH + 0.43 + 0.74), color=P["gold"]))
    add(lpm.lathe(f"tball{sx}", [(0.0, 0.0), (0.07, 0.04), (0.08, 0.09), (0.0, 0.15)], segments=6, at=(tx, ty, Z0 + TH + 0.43 + 0.95), color=P["gold"]))

syn = lpm.finish("Synagogue", parts, P, budget=3000)

me = syn.data
attr = me.attributes["lpm_color"]
me.materials.clear()
for name, hx, metal, rough, _em in P.entries:
    m = bpy.data.materials.new(f"Synagogue_{name}"); m.use_nodes = True
    rgb = tuple(lpm._srgb_to_linear(v) for v in lpm._hex(hx))
    m.diffuse_color = (*rgb, 1.0)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    me.materials.append(m)
for poly in me.polygons:
    poly.material_index = attr.data[poly.index].value

bpy.ops.wm.save_as_mainfile(filepath=OUT + ".blend")
bpy.ops.export_scene.gltf(filepath=OUT + ".glb", use_selection=False)
print("##TRIS##", lpm.tri_count(syn), tuple(round(d, 2) for d in syn.dimensions))
