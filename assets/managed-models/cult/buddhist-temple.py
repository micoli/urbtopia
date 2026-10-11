"""Stylized low-poly Buddhist temple: stone podium with front stairs, lilac stone hall wrapped by a veranda of red
pillars and timber beams, two tiers of teal hip roofs with upturned corners, gold finial, wooden lattice doors, two
stone lanterns and an incense urn. Budget 3 000 tris."""
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
    ("window", "#3d3956", 0.0, 0.5), ("teal", "#4aa685", 0.0, 0.8), ("teal_dark", "#37806a", 0.0, 0.8),
    ("gold", "#e8b94a", 0.5, 0.4),
])
parts = []
def add(*objs): parts.extend(objs)

def hip_roof(name, w, l, h, at, lift=0.3, color="teal"):
    """Concave hip roof on a w x l rectangle whose corners curl upwards."""
    prof = [(0.86, 0.06), (1.0, 0.0), (0.84, 0.2), (0.6, 0.52), (0.34, 0.82), (0.14, 1.0), (0.0, 1.0)]
    ob = lpm.lathe(name, prof, segments=8, at=(0, 0, 0), color=P[color])
    for v in ob.data.vertices:
        x, y, z = v.co
        r = math.hypot(x, y)
        if r < 1e-6:
            v.co = (at[0], at[1], at[2] + z * h); continue
        c, s = x / r, y / r
        k = 1.0 / max(abs(c), abs(s))
        corner = abs(abs(c) - abs(s)) < 1e-3
        dz = lift if corner and z < 0.07 else (lift * 0.35 if corner and z < 0.25 else 0.0)
        v.co = (at[0] + c * k * r * w / 2, at[1] + s * k * r * l / 2, at[2] + z * h + dz)
    return ob

# --- podium and stairs ---------------------------------------------------------------------------------------------------
add(lpm.box("podium", (6.4, 5.8, 0.55), at=(0, 0.3, 0), color=P["stone_dark"]))
add(lpm.box("podium_lip", (6.6, 6.0, 0.12), at=(0, 0.3, 0.5), color=P["stone"]))
for i in range(3):
    add(lpm.box(f"stair{i}", (2.2, 0.36, 0.5 - i * 0.18), at=(0, -2.6 - 0.36 * i - 0.18, 0), color=P["stone"]))
for sx in (-1, 1):
    add(lpm.box(f"stair_cheek{sx}", (0.24, 1.15, 0.55), at=(sx * 1.22, -3.0, 0), color=P["stone_dark"], taper=(1.0, 0.3)))
Z0 = 0.62

# --- hall core -----------------------------------------------------------------------------------------------------------
CW, CL, CH = 3.8, 3.0, 2.3
CY = 0.55
add(lpm.box("core", (CW, CL, CH), at=(0, CY, Z0), color=P["stone"]))
add(lpm.box("core_base", (CW + 0.06, CL + 0.06, 0.25), at=(0, CY, Z0 - 0.01), color=P["stone_dark"]))
FY = CY - CL / 2
for x in (-1.0, 0.0, 1.0):
    add(lpm.box(f"door{x:+.0f}", (0.82, 0.08, 1.75), at=(x, FY - 0.02, Z0 + 0.1), color=P["wood"]))
    add(lpm.box(f"lattice{x:+.0f}", (0.6, 0.06, 0.75), at=(x, FY - 0.06, Z0 + 0.95), color=P["window"]))
    add(lpm.box(f"lattice_bar{x:+.0f}", (0.05, 0.05, 0.75), at=(x, FY - 0.09, Z0 + 0.95), color=P["wood_dark"]))
    add(lpm.box(f"lattice_barh{x:+.0f}", (0.6, 0.05, 0.05), at=(x, FY - 0.09, Z0 + 1.3), color=P["wood_dark"]))
add(lpm.box("door_lintel", (3.0, 0.1, 0.16), at=(0, FY - 0.03, Z0 + 1.85), color=P["wood_dark"]))
add(lpm.box("plaque", (0.9, 0.06, 0.3), at=(0, FY - 0.05, Z0 + 2.0), color=P["gold"]))
for sx in (-1, 1):
    for y in (-0.6, 0.6):
        at = (sx * (CW / 2 + 0.01), CY + y, Z0 + 0.8)
        add(lpm.rotate(lpm.box(f"swin{sx}{y:+.1f}", (0.7, 0.08, 0.9), at=at, color=P["window"]), 90, axis="Z", about=at))
        add(lpm.rotate(lpm.box(f"swinbar{sx}{y:+.1f}", (0.05, 0.12, 0.9), at=at, color=P["wood_dark"]), 90, axis="Z", about=at))

# --- veranda: red pillars and a timber ring beam --------------------------------------------------------------------------
VW, VL, VH = 5.0, 4.3, 2.35
VY = 0.4
xs = (-VW / 2, -VW / 6, VW / 6, VW / 2)
ys = (-VL / 2, 0.0, VL / 2)
for x in xs:
    for y in ys:
        if abs(x) < VW / 2 - 0.01 and abs(y) < VL / 2 - 0.01: continue
        add(lpm.prism(f"pbase{x:+.1f}{y:+.1f}", 8, 0.17, 0.12, at=(x, VY + y, Z0 - 0.02), color=P["stone_dark"], rotate=22.5))
        add(lpm.prism(f"pillar{x:+.1f}{y:+.1f}", 8, 0.12, VH, at=(x, VY + y, Z0), color=P["roof"], rotate=22.5))
add(lpm.box("beam", (VW + 0.3, VL + 0.3, 0.22), at=(0, VY, Z0 + VH - 0.02), color=P["wood"]))
add(lpm.box("beam_top", (VW + 0.5, VL + 0.5, 0.14), at=(0, VY, Z0 + VH + 0.18), color=P["wood_dark"]))

# --- roofs ---------------------------------------------------------------------------------------------------------------
R1 = Z0 + VH + 0.3
add(hip_roof("roof_low", 6.6, 5.9, 1.05, (0, VY, R1), lift=0.35))
add(lpm.box("upper_wall", (3.0, 2.5, 0.85), at=(0, VY + 0.05, R1 + 0.55), color=P["stone"]))
add(lpm.box("upper_band", (3.1, 2.6, 0.16), at=(0, VY + 0.05, R1 + 1.3), color=P["wood_dark"]))
for x in (-0.8, 0.0, 0.8):
    add(lpm.box(f"upper_win{x:+.1f}", (0.45, 0.06, 0.35), at=(x, VY + 0.05 - 1.25 - 0.01, R1 + 0.8), color=P["window"]))
R2 = R1 + 1.42
add(hip_roof("roof_high", 4.6, 4.0, 1.2, (0, VY + 0.05, R2), lift=0.32))
add(lpm.lathe("finial", [(0.3, 0.0), (0.24, 0.12), (0.12, 0.2), (0.2, 0.32), (0.2, 0.42), (0.08, 0.5), (0.1, 0.62),
                         (0.06, 0.72), (0.08, 0.82), (0.04, 0.95), (0.0, 1.1)], segments=8, at=(0, VY + 0.05, R2 + 1.12), color=P["gold"]))

# --- stone lanterns and incense urn in front ------------------------------------------------------------------------------
for sx in (-1, 1):
    lx, ly = sx * 2.3, -3.3
    add(lpm.prism(f"lan_base{sx}", 6, 0.3, 0.2, at=(lx, ly, 0), color=P["stone_dark"]))
    add(lpm.prism(f"lan_post{sx}", 6, 0.12, 0.7, at=(lx, ly, 0.2), color=P["stone"]))
    add(lpm.box(f"lan_shelf{sx}", (0.5, 0.5, 0.1), at=(lx, ly, 0.88), color=P["stone_dark"]))
    add(lpm.box(f"lan_light{sx}", (0.32, 0.32, 0.3), at=(lx, ly, 0.97), color=P["gold"]))
    add(hip_roof(f"lan_roof{sx}", 0.7, 0.7, 0.3, (lx, ly, 1.26), lift=0.08, color="stone"))
    add(lpm.lathe(f"lan_top{sx}", [(0.0, 0.0), (0.07, 0.03), (0.08, 0.1), (0.0, 0.16)], segments=6, at=(lx, ly, 1.54), color=P["stone"]))
add(lpm.lathe("urn", [(0.0, 0.0), (0.28, 0.0), (0.36, 0.15), (0.4, 0.32), (0.34, 0.45), (0.38, 0.5), (0.0, 0.5)], segments=8, at=(0, -1.6, Z0 - 0.02), color=P["teal_dark"]))
for i in range(3):
    a = math.radians(90 + i * 120)
    add(lpm.prism(f"urn_leg{i}", 4, 0.05, 0.1, at=(0.24 * math.cos(a), -1.6 + 0.24 * math.sin(a), Z0 - 0.06), color=P["teal_dark"]))

temple = lpm.finish("Temple", parts, P, budget=3000)

me = temple.data
attr = me.attributes["lpm_color"]
me.materials.clear()
for name, hx, metal, rough, _em in P.entries:
    m = bpy.data.materials.new(f"Temple_{name}"); m.use_nodes = True
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
print("##TRIS##", lpm.tri_count(temple), tuple(round(d, 2) for d in temple.dimensions))
