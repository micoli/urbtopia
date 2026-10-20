"""Old wooden passenger coach: brown lower body, amber upper body with framed windows, curved dark roof, vestibule ends with railings, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("brown", "#7b3f1e"), ("amber", "#d98a2c"), ("cream", "#f0d9a0"), ("roof_grey", "#4a4c58"), ("pane", "#1f5fc4"), ("iron", "#26272e")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 3.5, 1.2, 0.32, 0.8
HW = WIDTH / 2
pick = cb.banded(P, [(0.14, "iron"), (0.46, "brown"), (0.52, "cream")], "amber", roof="amber")
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.FLAT_ROOF, breaks=(0.14, 0.46, 0.52), cap="amber")]
parts.append(cb.loft_body(P, "carbody roof", LENGTH + 0.2, WIDTH + 0.14, Z0 + HEIGHT - 0.03, 0.26, cb.banded(P, [], "roof_grey"), profile=[(0.98, 0.0), (0.97, 0.3), (0.85, 0.72), (0.5, 1.0), (0.0, 1.0)], front=dict(length=0.14, drop=0.1, tip=0.94, steps=2, power=1.0), rear=dict(length=0.14, drop=0.1, tip=0.94, steps=2, power=1.0), cap="roof_grey"))
parts += cb.window_frames(P, "brown", "pane", -1.35, 1.35, 9, Z0 + 0.46, Z0 + 0.7, HW, gap=0.42)
parts += cb.underbody(P, LENGTH, HW, Z0, color="iron", spans=((-0.5, 0.45), (0.55, 0.45)))
for side in (-1, 1):
    parts.append(tk.strut(P, "iron", (side * (HW - 0.06), -1.2, Z0 - 0.14), (side * (HW - 0.06), 1.2, Z0 - 0.14), radius=0.012))
    parts.append(tk.strut(P, "iron", (side * (HW - 0.06), -1.2, Z0 - 0.14), (side * (HW - 0.06), 0.0, Z0 - 0.26), radius=0.012))
    parts.append(tk.strut(P, "iron", (side * (HW - 0.06), 1.2, Z0 - 0.14), (side * (HW - 0.06), 0.0, Z0 - 0.26), radius=0.012))
for y in (-1.2, 1.2):
    parts += cb.truck(P, y, track=0.46, r=0.14, spacing=0.36, frame="iron")

for sign in (-1, 1):
    end = sign * (LENGTH / 2)
    parts.append(lpm.box("vestibule floor", (WIDTH * 0.9, 0.34, 0.05), at=(0, end + sign * 0.17, Z0 - 0.03), color=P["iron"]))
    parts.append(lpm.box("end door", (0.5, 0.03, 0.55), at=(0, end + sign * 0.005, Z0 + 0.08), color=P["brown"]))
    parts.append(lpm.box("end door window", (0.28, 0.035, 0.22), at=(0, end + sign * 0.008, Z0 + 0.3), color=P["pane"]))
    for x in (-0.5, 0.5):
        parts.append(lpm.box("rail post", (0.035, 0.035, 0.42), at=(x, end + sign * 0.33, Z0 - 0.02), color=P["iron"]))
    parts.append(lpm.box("rail top", (WIDTH * 0.9, 0.03, 0.03), at=(0, end + sign * 0.33, Z0 + 0.4), color=P["iron"]))
    for x in (-0.5, 0.5):
        parts.append(lpm.box("rail top", (0.03, 0.34, 0.03), at=(x, end + sign * 0.17, Z0 + 0.4), color=P["iron"]))
    parts.append(lpm.box("buffer beam", (0.9, 0.06, 0.08), at=(0, end + sign * 0.36, Z0 - 0.08), color=P["iron"]))
    for x in (-0.36, 0.36):
        parts.append(tk.cyl_y(P, "chrome", 8, 0.04, end + sign * 0.36 if sign > 0 else end + sign * 0.46, end + sign * 0.46 if sign > 0 else end + sign * 0.36, Z0 - 0.04, x=x, name="buffer"))
    parts.append(lpm.box("step", (0.5, 0.12, 0.05), at=(0, end + sign * 0.32, Z0 - 0.2), color=P["iron"]))
for y in (-0.9, 0.0, 0.9):
    parts.append(lpm.box("roof vent", (0.16, 0.14, 0.08), at=(0, y, Z0 + HEIGHT + 0.23), color=P["iron"]))
    parts.append(lpm.box("roof vent cap", (0.2, 0.18, 0.025), at=(0, y, Z0 + HEIGHT + 0.31), color=P["iron"]))

tk.build("SteamWagon", parts, COLORS, tk.out_dir(__file__), budget=9000)
