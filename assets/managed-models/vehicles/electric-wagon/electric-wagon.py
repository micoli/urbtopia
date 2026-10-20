"""Modern passenger coach: white shell, blue window band between pillars, dark skirt, red chamfered ends with a blue end door, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("loco_red", "#d3303a"), ("grey", "#a3a9b5"), ("roof_grey", "#6d7380"), ("blue_glass", "#1f5fc4"), ("steel", "#4d5260")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 3.7, 1.3, 0.3, 0.86
HW = WIDTH / 2
END = dict(length=0.3, drop=0.0, tip=0.88, rise=0.0, steps=2, power=1.0)
DOORS = [(-1.84, -1.06), (1.06, 1.84)]
pick = cb.banded(P, [(0.18, "steel"), (0.4, "white"), (0.46, "grey"), (0.74, "blue_glass")], "white", roof="roof_grey", ends="loco_red", end_length=0.3, length=LENGTH, roof_width=0.45,
                 door_zones=DOORS, door_replace=("blue_glass",), door_fill="white", door_zf=(0.4, 0.8))
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ELECTRIC, breaks=(0.18, 0.4, 0.46, 0.74), front=END, rear=END, cap="loco_red", cuts=cb.zone_cuts(DOORS))]

z_lo, z_hi = Z0 + HEIGHT * 0.46, Z0 + HEIGHT * 0.74
parts += cb.window_pillars(P, "white", -1.0, 1.0, 8, z_lo, z_hi, HW, width=0.07)
parts += cb.underbody(P, LENGTH, HW, Z0, spans=((-0.45, 0.5), (0.55, 0.4)))
for sign in (-1, 1):
    parts += cb.truck(P, sign * 1.05, track=0.52, r=0.17, spacing=0.5)
    y = sign * (LENGTH / 2 + 0.03)
    parts.append(lpm.box("end door", (0.5, 0.025, 0.6), at=(0, y, Z0 + 0.12), color=P["blue_glass"]))
    parts.append(lpm.box("end door frame", (0.58, 0.02, 0.68), at=(0, y - sign * 0.004, Z0 + 0.08), color=P["white"]))
    parts.append(lpm.box("buffer beam", (HW * 1.5, 0.08, 0.12), at=(0, y + sign * 0.02, Z0 - 0.04), color=P["steel"]))
    parts += cb.round_lamp(P, 0.4, y + sign * 0.03, Z0 + 0.18, radius=0.04, colour="taillight", facing=sign),
    parts += cb.sliding_door(P, sign * 1.45, Z0 + 0.1, Z0 + 0.72, HW, frame="grey", width=0.6)
parts += cb.roof_unit(P, -0.7, Z0 + HEIGHT - 0.01, width=0.55, length=0.8)
parts += cb.roof_unit(P, 0.7, Z0 + HEIGHT - 0.01, width=0.55, length=0.8)
parts.append(lpm.box("roof cable", (0.05, 2.6, 0.03), at=(0, 0, Z0 + HEIGHT + 0.01), color=P["steel"]))

tk.build("ElectricWagon", parts, COLORS, tk.out_dir(__file__), budget=9000)
