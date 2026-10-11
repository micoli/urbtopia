"""Stylized low-poly mosque: lilac stone prayer hall with timber trim, teal central dome on a drum, two small corner
domes, a front portal with a pointed arch, a minaret with a timber balcony, gold crescent finials. Budget 3 000 tris."""
import math, sys
import bpy
sys.path.insert(0, "/Users/omichaud/.claude/skills/blender-lpm-skill/scripts")
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

def arch(w, h):
    r = w / 2
    return [(-r, 0.0), (r, 0.0), (r, h - r), (r * 0.55, h - r * 0.35), (0.0, h), (-r * 0.55, h - r * 0.35), (-r, h - r)]

def side_window(name, w, h, at, color="window"):
    ob = lpm.sweep(name, arch(w, h), depth=0.08, at=at, color=P[color], axis="y")
    return lpm.rotate(ob, 90, axis="Z", about=at)

def crescent(name, r, at):
    outer = [(r * math.cos(math.radians(a)), r * math.sin(math.radians(a))) for a in range(50, 311, 26)]
    inner = [(r * 0.35 + r * 0.8 * math.cos(math.radians(a)), r * 0.8 * math.sin(math.radians(a))) for a in range(290, 69, -44)]
    return lpm.sweep(name, outer + inner, depth=0.05, at=at, color=P["gold"], axis="y")

def dome(name, r, at, segments=12, color="teal"):
    prof = [(r, 0.0), (r * 1.06, r * 0.35), (r * 0.98, r * 0.7), (r * 0.72, r * 1.05), (r * 0.36, r * 1.3), (0.0, r * 1.45)]
    return lpm.lathe(name, prof, segments=segments, at=at, color=P[color])

def finial(name, at, h=0.5, r=0.14):
    x, y, z = at
    add(lpm.prism(f"{name}_rod", 6, 0.03, h, at=(x, y, z), color=P["gold"]))
    add(lpm.lathe(f"{name}_ball", [(0.0, 0.0), (0.06, 0.03), (0.07, 0.08), (0.0, 0.13)], segments=6, at=(x, y, z + h * 0.35), color=P["gold"]))
    add(crescent(f"{name}_moon", r, (x, y, z + h + r * 0.6)))

# --- plinth and steps ----------------------------------------------------------------------------------------------
HW, HL, HH = 5.0, 4.6, 2.8       # hall width (x), length (y), height
HY = 0.5
add(lpm.box("plinth", (HW + 0.6, HL + 1.6, 0.25), at=(0, HY - 0.5, 0), color=P["stone_dark"]))
add(lpm.box("step", (2.0, 0.5, 0.13), at=(0, HY - HL / 2 - 1.5, 0), color=P["stone_dark"]))
Z0 = 0.25

# --- prayer hall --------------------------------------------------------------------------------------------------
add(lpm.box("hall", (HW, HL, HH), at=(0, HY, Z0), color=P["stone"]))
add(lpm.box("hall_base", (HW + 0.08, HL + 0.08, 0.35), at=(0, HY, Z0 - 0.01), color=P["stone_dark"]))
add(lpm.box("cornice", (HW + 0.24, HL + 0.24, 0.2), at=(0, HY, Z0 + HH - 0.05), color=P["wood_dark"]))
add(lpm.box("parapet", (HW + 0.1, HL + 0.1, 0.3), at=(0, HY, Z0 + HH + 0.14), color=P["stone"]))
add(lpm.box("roof_slab", (HW - 0.2, HL - 0.2, 0.36), at=(0, HY, Z0 + HH + 0.1), color=P["stone_dark"]))
for sx in (-1, 1):
    for sy in (-1, 1):
        add(lpm.box(f"pier{sx}{sy}", (0.24, 0.24, HH - 0.3), at=(sx * HW / 2, HY + sy * HL / 2, Z0 + 0.3), color=P["wood"]))
for sx in (-1, 1):
    for y in (-1.3, 0.0, 1.3):
        add(side_window(f"win{sx}{y:+.1f}", 0.5, 1.2, (sx * (HW / 2 + 0.01), HY + y, Z0 + 0.8)))
        add(lpm.box(f"sill{sx}{y:+.1f}", (0.12, 0.7, 0.08), at=(sx * (HW / 2 + 0.03), HY + y, Z0 + 0.74), color=P["wood"]))
for x in (-1.5, 0.0, 1.5):
    add(lpm.sweep(f"winb{x:+.1f}", arch(0.5, 1.2), depth=0.08, at=(x, HY + HL / 2 + 0.01, Z0 + 0.8), color=P["window"], axis="y"))
add(lpm.box("band", (HW + 0.04, HL + 0.04, 0.12), at=(0, HY, Z0 + 2.2), color=P["teal"]))

# --- central dome on an octagonal drum ------------------------------------------------------------------------------------
RZ = Z0 + HH + 0.44
add(lpm.prism("drum", 8, 1.55, 0.7, at=(0, HY, RZ - 0.02), color=P["stone"], rotate=22.5))
add(lpm.prism("drum_band", 8, 1.62, 0.14, at=(0, HY, RZ + 0.62), color=P["wood_dark"], rotate=22.5))
for i in range(8):
    a = math.radians(i * 45)
    at = (1.55 * math.cos(math.radians(22.5)) * math.cos(a) + 0.0, HY + 1.55 * math.cos(math.radians(22.5)) * math.sin(a), RZ + 0.12)
    w = lpm.sweep(f"drum_win{i}", arch(0.26, 0.42), depth=0.06, at=(0, 0, 0), color=P["window"], axis="y")
    lpm.rotate(w, i * 45 + 90, axis="Z"); lpm.move(w, at[0] + 0.01 * math.cos(a), at[1] + 0.01 * math.sin(a), at[2]); add(w)
DZ = RZ + 0.72
add(dome("dome", 1.5, (0, HY, DZ), segments=12))
finial("dome_fin", (0, HY, DZ + 1.5 * 1.45 - 0.05), h=0.55, r=0.18)

# --- portal (iwan) at the front -----------------------------------------------------------------------------------------
FY = HY - HL / 2
PW, PH, PD = 2.4, 3.7, 0.8
add(lpm.box("portal", (PW, PD, PH), at=(0, FY - PD / 2 + 0.05, Z0), color=P["stone"]))
add(lpm.box("portal_cap", (PW + 0.2, PD + 0.2, 0.2), at=(0, FY - PD / 2 + 0.05, Z0 + PH - 0.02), color=P["wood_dark"]))
for x in (-0.8, -0.27, 0.27, 0.8):
    add(lpm.box(f"merlon{x:+.2f}", (0.3, 0.3, 0.26), at=(x, FY - PD / 2 + 0.05, Z0 + PH + 0.16), color=P["stone"]))
PF = FY - PD + 0.05
add(lpm.sweep("portal_frame", arch(1.6, 2.9), depth=0.08, at=(0, PF - 0.02, Z0), color=P["teal"], axis="y"))
add(lpm.sweep("portal_recess", arch(1.3, 2.7), depth=0.08, at=(0, PF - 0.05, Z0), color=P["window"], axis="y"))
add(lpm.sweep("door", arch(0.8, 1.75), depth=0.08, at=(0, PF - 0.09, Z0), color=P["wood"], axis="y"))
add(lpm.box("door_split", (0.05, 0.04, 1.55), at=(0, PF - 0.14, Z0), color=P["wood_dark"]))
for sx in (-1, 1):
    add(lpm.box(f"portal_post{sx}", (0.2, 0.2, PH - 0.1), at=(sx * PW / 2, PF + 0.05, Z0), color=P["wood"]))

# --- two small corner domes on kiosks at the front corners ---------------------------------------------------------------
for sx in (-1, 1):
    cx, cy = sx * (HW / 2 - 0.55), FY + 0.55
    add(lpm.prism(f"kiosk{sx}", 8, 0.45, 0.5, at=(cx, cy, Z0 + HH + 0.4), color=P["stone"], rotate=22.5))
    add(dome(f"kdome{sx}", 0.45, (cx, cy, Z0 + HH + 0.88), segments=8))
    finial(f"kfin{sx}", (cx, cy, Z0 + HH + 0.88 + 0.45 * 1.45 - 0.03), h=0.25, r=0.09)

# --- minaret -------------------------------------------------------------------------------------------------------------
MX, MY = HW / 2 + 0.9, FY - 0.2
add(lpm.prism("min_base", 8, 0.62, 1.2, at=(MX, MY, 0), color=P["stone_dark"], rotate=22.5))
add(lpm.prism("min_shaft", 8, 0.46, 4.6, at=(MX, MY, 1.18), color=P["stone"], radius_top=0.4, rotate=22.5))
for z in (2.4, 3.7):
    add(lpm.prism(f"min_ring{z}", 8, 0.47, 0.12, at=(MX, MY, z), color=P["teal"], rotate=22.5))
add(side_window("min_win", 0.18, 0.5, (MX - 0.44, MY, 2.65)))
BZ = 5.7
add(lpm.lathe("balcony", [(0.4, 0.0), (0.72, 0.3), (0.72, 0.42), (0.0, 0.42)], segments=8, at=(MX, MY, BZ), color=P["wood"]))
add(lpm.prism("rail", 8, 0.7, 0.32, at=(MX, MY, BZ + 0.4), color=P["wood_dark"], radius_top=0.7, rotate=0, cap=False))
add(lpm.prism("min_top", 8, 0.32, 1.2, at=(MX, MY, BZ + 0.4), color=P["stone"], rotate=22.5))
add(lpm.prism("min_band", 8, 0.36, 0.12, at=(MX, MY, BZ + 1.55), color=P["wood_dark"], rotate=22.5))
add(lpm.prism("min_cap", 8, 0.42, 1.3, at=(MX, MY, BZ + 1.62), color=P["teal"], radius_top=0.02, rotate=22.5))
finial("min_fin", (MX, MY, BZ + 2.88), h=0.3, r=0.11)

mosque = lpm.finish("Mosque", parts, P, budget=3000)

me = mosque.data
attr = me.attributes["lpm_color"]
me.materials.clear()
for name, hx, metal, rough, _em in P.entries:
    m = bpy.data.materials.new(f"Mosque_{name}"); m.use_nodes = True
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
print("##TRIS##", lpm.tri_count(mosque), tuple(round(d, 2) for d in mosque.dimensions))
