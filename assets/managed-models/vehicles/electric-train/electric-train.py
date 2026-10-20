"""Modern electric locomotive: red upper body, white band, dark skirt, sloped cabs at both ends, pantographs, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("loco_red", "#d3303a"), ("grey", "#a3a9b5"), ("roof_grey", "#6d7380"), ("blue_glass", "#2f6fd0"), ("steel", "#4d5260")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 3.7, 1.3, 0.3, 0.86
HW = WIDTH / 2
NOSE = dict(length=0.6, drop=0.26, tip=0.8, rise=0.06, steps=4, power=1.4)
pick = cb.banded(P, [(0.18, "steel"), (0.46, "white")], "loco_red", roof="roof_grey", windscreen="blue_glass", roof_width=0.45)
body = cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ELECTRIC, breaks=(0.18, 0.46), front=NOSE, rear=NOSE, cap="loco_red")
parts = [body]

parts += cb.underbody(P, LENGTH, HW, Z0, spans=((-0.55, 0.32), (0.6, 0.34)))
for sign in (-1, 1):
    parts += cb.truck(P, sign * 1.05, track=0.52, r=0.17, spacing=0.42, axles=3)
    y = sign * (LENGTH / 2 + 0.02)
    parts.append(lpm.box("buffer beam", (HW * 1.5, 0.08, 0.14), at=(0, y, Z0 - 0.04), color=P["steel"]))
    for x in (-0.42, 0.42):
        parts.append(tk.cyl_y(P, "chrome", 8, 0.05, y if sign > 0 else y - 0.1, (y + 0.1) if sign > 0 else y, Z0 + 0.02, x=x, name="buffer"))
        parts.append(cb.round_lamp(P, x * 0.8, y + sign * 0.01, Z0 + 0.28, radius=0.055, colour="headlight" if sign < 0 else "taillight", facing=sign))
    parts.append(cb.round_lamp(P, 0, y + sign * 0.01, Z0 + 0.28, radius=0.04, colour="white", facing=sign))
    parts.append(lpm.box("number plate", (0.3, 0.025, 0.1), at=(0, y + sign * 0.0, Z0 + 0.05), color=P["white"]))

for y0 in (-0.55, 0.0, 0.55):
    for side in (-1, 1):
        for i in range(4):
            parts.append(lpm.box("louver", (0.018, 0.34, 0.02), at=(side * (HW + 0.004), y0 + (0.0 if i % 2 == 0 else 0.0), Z0 + 0.5 + i * 0.045), color=P["steel"]))

ROOF = Z0 + HEIGHT
parts += cb.pantograph(P, -0.45, ROOF, spread=0.3, height=0.46)
parts += cb.pantograph(P, 0.8, ROOF, spread=0.2, height=0.16)
parts += cb.roof_unit(P, 0.05, ROOF - 0.01, width=0.55, length=0.7)
parts += cb.roof_unit(P, 1.3, ROOF - 0.01, width=0.45, length=0.45, vents=2)
parts.append(lpm.box("roof cable", (0.04, 1.6, 0.03), at=(0, 0.2, ROOF + 0.01), color=P["steel"]))

tk.build("ElectricTrain", parts, COLORS, tk.out_dir(__file__), budget=9000)
