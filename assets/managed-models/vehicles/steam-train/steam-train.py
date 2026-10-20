"""Old steam locomotive: black boiler with gold bands, red spoked wheels and running boards, gold domes, tall chimney, slatted red cowcatcher, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("loco_red", "#c9352f"), ("brass", "#f0b72a"), ("coal", "#25262d"), ("cab", "#34353f"), ("boiler", "#30313a"), ("roof_grey", "#4d4f5b"), ("pane", "#1f5fc4")]
P = kit.palette(COLORS)

BOILER_Z = 0.9
parts = [lpm.box("frame", (0.84, 3.4, 0.14), at=(0, 0.0, 0.3), color=P["coal"])]
parts.append(lpm.box("frame beam", (0.9, 3.4, 0.05), at=(0, 0.0, 0.43), color=P["loco_red"]))
parts.append(tk.cyl_y(P, "boiler", 14, 0.31, -1.35, 0.7, BOILER_Z, name="boiler"))
parts.append(tk.cyl_y(P, "coal", 14, 0.335, -1.62, -1.3, BOILER_Z, name="smokebox"))
parts.append(tk.cyl_y(P, "hub_dark", 14, 0.28, -1.68, -1.62, BOILER_Z, name="smokebox door"))
parts.append(tk.cyl_y(P, "chrome", 8, 0.045, -1.72, -1.68, BOILER_Z, name="smokebox handle"))
parts.append(tk.cyl_y(P, "coal", 14, 0.33, -1.3, -1.25, BOILER_Z, name="smokebox ring"))
for y in (-0.95, -0.5, -0.05, 0.4):
    parts.append(tk.cyl_y(P, "brass", 14, 0.318, y, y + 0.045, BOILER_Z, name="boiler band"))

for y, size, h in ((-0.85, 0.2, 0.28), (-0.3, 0.2, 0.28), (0.3, 0.17, 0.2)):
    parts.append(lpm.box("dome collar", (size + 0.06, size + 0.06, 0.05), at=(0, y, BOILER_Z + 0.28), color=P["coal"]))
    parts.append(lpm.box("steam dome", (size, size, h), at=(0, y, BOILER_Z + 0.32), color=P["brass"], taper=(0.85, 0.85)))
parts.append(lpm.lathe("chimney", [(0.075, 0), (0.075, 0.22), (0.105, 0.33), (0.16, 0.41), (0.15, 0.46)], segments=10, at=(0, -1.45, BOILER_Z + 0.22), color=P["coal"]))
parts.append(lpm.box("headlamp", (0.16, 0.14, 0.18), at=(0, -1.55, BOILER_Z + 0.3), color=P["coal"]))
parts.append(cb.round_lamp(P, 0, -1.63, BOILER_Z + 0.4, radius=0.055, colour="headlight", facing=-1))
parts.append(lpm.prism("bell", 8, 0.06, 0.1, at=(0, 0.1, BOILER_Z + 0.3), radius_top=0.035, color=P["brass"]))

for side in (-1, 1):
    parts.append(lpm.box("running board", (0.2, 2.5, 0.045), at=(side * 0.46, -0.15, 0.64), color=P["loco_red"]))
    parts.append(lpm.box("running board edge", (0.03, 2.5, 0.07), at=(side * 0.56, -0.15, 0.62), color=P["coal"]))
    for y in (-1.2, -0.2, 0.7):
        parts.append(tk.strut(P, "chrome", (side * 0.4, y, 0.68), (side * 0.37, y, 1.0), radius=0.012))
    parts.append(tk.strut(P, "chrome", (side * 0.37, -1.3, 1.0), (side * 0.37, 0.9, 1.0), radius=0.014))
    parts.append(lpm.box("cylinder", (0.18, 0.5, 0.26), at=(side * 0.45, -1.1, 0.4), color=P["loco_red"], taper=(0.9, 0.95)))
    parts.append(lpm.box("cylinder cover", (0.2, 0.08, 0.28), at=(side * 0.45, -1.4, 0.39), color=P["coal"]))
    parts.append(lpm.box("main rod", (0.03, 1.0, 0.05), at=(side * 0.56, -0.5, 0.31), color=P["hub"]))
    parts.append(lpm.box("coupling rod", (0.03, 1.2, 0.05), at=(side * 0.56, 0.05, 0.27), color=P["hub"]))
    parts.append(lpm.box("valve gear", (0.025, 0.6, 0.03), at=(side * 0.57, -0.15, 0.45), color=P["hub_dark"]))
    for y in (-0.55, 0.05, 0.65):
        parts += cb.spoked_wheel(P, side * 0.5, y, 0.27, 0.08, rim="loco_red", tire="coal", hub="brass", spokes=3, sides=14)
        parts.append(lpm.box("crank pin", (0.05, 0.05, 0.05), at=(side * 0.57, y, 0.25), color=P["brass"]))
    parts += cb.solid_wheel(P, side * 0.45, -1.2, 0.13, 0.07, tire="coal", rim="hub_dark")
    parts += cb.solid_wheel(P, side * 0.45, 1.3, 0.13, 0.07, tire="coal", rim="hub_dark")
parts.append(lpm.box("axle front", (0.9, 0.04, 0.04), at=(0, -1.2, 0.11), color=P["coal"]))
parts.append(lpm.box("axle rear", (0.9, 0.04, 0.04), at=(0, 1.3, 0.11), color=P["coal"]))

CAB_Z0, CAB_H = 0.45, 0.95
cab_pick = cb.banded(P, [(0.25, "coal")], "cab", roof="cab")
cab = cb.loft_body(P, "carbody cab", 1.15, 0.96, CAB_Z0, CAB_H, cab_pick, profile=cb.FLAT_ROOF, breaks=(0.25,), cap="cab")
parts.append(lpm.move(cab, 0, 1.13, 0))
roof = cb.loft_body(P, "carbody cab roof", 1.45, 1.16, CAB_Z0 + CAB_H - 0.02, 0.17, cb.banded(P, [], "roof_grey"), profile=cb.ROUNDED, front=dict(length=0.2, drop=0.05, tip=0.9, steps=2, power=1.0), rear=dict(length=0.15, drop=0.05, tip=0.92, steps=2, power=1.0), cap="roof_grey")
parts.append(lpm.move(roof, 0, 1.17, 0))
parts += cb.window_frames(P, "coal", "pane", 0.75, 1.55, 2, CAB_Z0 + 0.5, CAB_Z0 + 0.82, 0.48, gap=0.4)
for side in (-1, 1):
    parts.append(lpm.box("cab front window", (0.2, 0.03, 0.3), at=(side * 0.25, 0.545, CAB_Z0 + 0.5), color=P["pane"]))
    parts.append(lpm.box("cab front frame", (0.26, 0.025, 0.36), at=(side * 0.25, 0.54, CAB_Z0 + 0.47), color=P["coal"]))
    parts.append(lpm.box("cab step", (0.14, 0.34, 0.04), at=(side * 0.5, 1.0, 0.3), color=P["coal"]))
parts.append(lpm.box("cab rear wall", (0.96, 0.06, 0.55), at=(0, 1.72, CAB_Z0), color=P["cab"]))
parts.append(lpm.box("coal", (0.8, 0.3, 0.22), at=(0, 1.85, 0.45), color=P["coal"], taper=(0.7, 0.8)))

parts.append(lpm.box("buffer beam", (1.0, 0.1, 0.2), at=(0, -1.72, 0.3), color=P["loco_red"]))
for x in (-0.38, 0.38):
    parts.append(tk.cyl_y(P, "chrome", 8, 0.05, -1.86, -1.72, 0.4, x=x, name="buffer"))
slat_top, slat_bottom = 0.5, 0.27
for i in range(-3, 4):
    parts.append(tk.strut(P, "loco_red", (i * 0.13, -1.72, slat_top), (i * 0.2, -2.1, slat_bottom), radius=0.022))
for z, y, w in ((0.5, -1.74, 0.9), (0.38, -1.92, 1.1), (0.28, -2.1, 1.3)):
    parts.append(lpm.box("cowcatcher bar", (w, 0.04, 0.04), at=(0, y, z), color=P["loco_red"]))
for side in (-1, 1):
    parts.append(kit.side_profile("cowcatcher side", [(-1.72, 0.5), (-2.1, 0.27), (-1.72, 0.27)], 0.03, P["loco_red"], at_x=side * 0.48))
parts.append(lpm.box("rear coupler", (0.12, 0.2, 0.08), at=(0, 2.05, 0.34), color=P["coal"]))

tk.build("SteamTrain", parts, COLORS, tk.out_dir(__file__), budget=14000)
