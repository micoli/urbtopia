"""Double-decker bus: red shell, two bands of framed windows, cream trim, big front panes, destination boards, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("bus_red", "#d3303a"), ("red_dark", "#a8222a"), ("pane", "#1b2a4a"), ("cream", "#efe3c4")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 4.6, 1.5, 0.3, 1.82
HW = WIDTH / 2
END = dict(length=0.2, drop=0.1, tip=0.92, steps=2, power=1.0)
BREAKS = (0.06, 0.2, 0.43, 0.49, 0.54, 0.77)
DOORS = [(-2.1, -1.32)]
pick = cb.banded(P, [(0.06, "dark"), (0.2, "bus_red"), (0.43, "pane"), (0.49, "bus_red"), (0.54, "cream"), (0.77, "pane")], "bus_red", roof="bus_red",
                 door_zones=DOORS, door_replace=("pane",), door_fill="bus_red", door_zf=(0.2, 0.43), door_side=1)
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.PASSENGER, breaks=BREAKS, front=END, rear=END, cap="bus_red", cuts=cb.zone_cuts(DOORS))]

for lo, hi, count, y0, skip in ((0.2, 0.43, 8, -1.3, ()), (0.54, 0.77, 9, -1.95, ())):
    parts += cb.window_pillars(P, "bus_red", y0, 2.0, count, Z0 + HEIGHT * lo, Z0 + HEIGHT * hi, HW, width=0.08, sides=(-1,))
    parts += cb.window_pillars(P, "bus_red", y0, 2.0, count, Z0 + HEIGHT * lo, Z0 + HEIGHT * hi, HW, width=0.08, sides=(1,))
parts += cb.sliding_door(P, -1.72, Z0 + 0.1, Z0 + HEIGHT * 0.43, HW, frame="red_dark", glass="pane", width=0.62, sides=(1,))
front, rear = -LENGTH / 2 - 0.01, LENGTH / 2 + 0.01
for lo, hi in ((0.2, 0.43), (0.54, 0.77)):
    parts.append(lpm.box("windscreen", (WIDTH * 0.84, 0.03, HEIGHT * (hi - lo)), at=(0, front - 0.005, Z0 + HEIGHT * lo), color=P["pane"]))
    parts.append(lpm.box("windscreen pillar", (0.06, 0.04, HEIGHT * (hi - lo)), at=(0, front - 0.01, Z0 + HEIGHT * lo), color=P["bus_red"]))
    parts.append(lpm.box("rear window", (WIDTH * 0.6, 0.03, HEIGHT * (hi - lo) * 0.9), at=(0, rear, Z0 + HEIGHT * lo), color=P["pane"]))
parts += [lpm.box("destination", (0.9, 0.03, 0.12), at=(0, front - 0.005, Z0 + HEIGHT * 0.8), color=P["dark"]),
          lpm.box("destination glow", (0.7, 0.032, 0.06), at=(0, front - 0.008, Z0 + HEIGHT * 0.8 + 0.03), color=P["signal"]),
          lpm.box("grille", (0.7, 0.03, 0.12), at=(0, front - 0.005, Z0 + 0.14), color=P["black"]),
          lpm.box("cream stripe front", (WIDTH * 0.8, 0.03, 0.05), at=(0, front - 0.005, Z0 + HEIGHT * 0.49), color=P["cream"])]
parts += cb.front_face(P, Z0, HW, front, Z0 + 0.2)
parts += cb.rear_face(P, Z0, HW, rear, Z0 + 0.34)
parts += cb.bus_wheels(P, HW, (-1.0, 1.55))
for side in (-1, 1):
    parts += cb.side_mirror(P, side, -LENGTH / 2 + 0.3, Z0 + HEIGHT * 0.3, HW)
parts += cb.roof_unit(P, 0.5, Z0 + HEIGHT - 0.02, width=0.8, length=1.2, colour="red_dark", vents=3)

tk.build("BusDouble", parts, COLORS, tk.out_dir(__file__), budget=9000)
